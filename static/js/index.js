/// Function to split the elliptic curve into segments in order to avoid sharp edges and display a smooth curve
function splitCurve(curve) {
  for (let i = 0; i < curve.length - 1; ++i) {
    const p1 = curve[i];
    const p2 = curve[i + 1];
    distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    if (distance > 0.25) {
      curve.splice(i + 1, 0, {
        x: p1.x + Math.abs(p1.x - curve[i - 1].x),
        y: 0,
      });
      curve.splice(i + 2, 0, {
        x: p2.x - Math.abs(p2.x - curve[i + 2].x),
        y: 0,
      });
      break;
    }
  }
  return curve;
}

/// Function to calculate the elliptic curve based on the given parameters
function calculateCurve(a, b) {
  let f_half = [];
  for (let x = -range; x <= range; x += step) {
    const expr = new Complex(x ** 3 + a * x + b);
    const sqrtExpr = expr.sqrt();
    if (!isNaN(sqrtExpr.re) && sqrtExpr.im === 0) {
      const y = Math.round(Number(sqrtExpr.re) * 100) / 100;
      f_half.push({ x: x, y: y });
    }
  }
  f_half = splitCurve(f_half);

  let distance = Math.abs((f_half[0].x - f_half[1].x) / 2);
  if (Math.abs(f_half[0].y) > threshold)
    f_half.unshift({ x: f_half[0].x - distance, y: 0 });

  const s_half = f_half.map((p) => {
    return { x: p.x, y: -p.y };
  });
  return [f_half, s_half];
}

/// Generate and display the elliptic curve on the canvas
function generateCurve() {
  if (
    $("#a, #b")
      .filter(":input")
      .filter(function () {
        return !this.value.trim();
      }).length
  ) {
    $("#p").prop("disabled", true);
    return;
  }

  const request = {
    a: parseInt($("#a").val()),
    b: parseInt($("#b").val()),
  };
  $.ajax({
    url: "/curve",
    type: "POST",
    data: JSON.stringify(request),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data) {
      destroyCharts();
      [f_half, s_half] = calculateCurve(request.a, request.b);
      const ctx = $("#Curve")[0].getContext("2d");
      CurveChart = new Chart(ctx, {
        type: "line",
        data: {
          datasets: [createDatasetConfig(f_half), createDatasetConfig(s_half)],
        },
        options: {
          events: [],
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: createAxisConfig("linear", "bottom", -10, 10),
            y: createAxisConfig("linear", "left", -10, 10),
          },
          elements: {
            point: {
              radius: 0,
            },
          },
        },
      });
      $("#p").prop("disabled", false);
    },
    error: function (err) {
      console.log(err);
    },
  });
}

/// Function to calculate the points on the elliptic curve
function calculatePoints() {
  let request = {
    p: parseInt($("#p").val()),
  };
  $.ajax({
    url: "/points",
    type: "POST",
    data: JSON.stringify(request),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data) {
      const x_max = Math.max(...data.points.map((p) => p[0])) + 1;
      const y_max = Math.floor(request.p);
      const ctx = $("#Points")[0].getContext("2d");
      if (PointsChart) PointsChart.destroy();
      PointsChart = new Chart(ctx, {
        type: "scatter",
        data: {
          datasets: [
            {
              data: data.points,
              backgroundColor: "rgba(0, 0, 255, 1)",
              order: 1,
            },
          ],
        },
        options: {
          events: [],
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: createAxisConfig("linear", "bottom", -1, x_max),
            y: createAxisConfig("linear", "left", -1, y_max),
          },
        },
      });
      const base = $("#base");
      base.prop("disabled", false);
      base.html('<option value="">Select base point</option>');
      data.points.forEach((point) => {
        base.append(`<option value="${point}">(${point})</option>`);
      });
    },
    error: function (jqXHR, textStatus, errorThrown) {
      if (jqXHR.status == 400) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: jqXHR.responseJSON.error,
        });
      } else {
        alert("Something went wrong");
      }
    },
  });
}

/// Function to remark the base point on the Points chart
function remarkBasePoint() {
  $.ajax({
    url: "/base",
    type: "POST",
    data: JSON.stringify({ base: $("#base").val() }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data) {
      const index = data.points.findIndex(
        (p) => p[0] === data.base[0] && p[1] === data.base[1]
      );

      if (index !== -1) {
        PointsChart.data.datasets[0].backgroundColor =
          PointsChart.data.datasets[0].data.map((_, i) =>
            i === index ? "rgba(255, 76, 48)" : "rgba(0, 0, 255, 1)"
          );
        PointsChart.data.datasets[0].pointRadius =
          PointsChart.data.datasets[0].data.map((_, i) =>
            i === index ? 7 : 4
          );
        PointsChart.update();
      }
    },
    error: function (err) {
      console.log(err);
    },
  });
}

/// Event listeners to validate Curve Properties inputs
function validateCurve() {
  // Event handlers for inputs
  ids.forEach((id) => {
    $(`#${id}`).on("input", function (e) {
      e.preventDefault();
      resetInputs(ids[ids.length - 1]);
      generateCurve();
    });
  });

  // Event handler for input with ID "p"
  $("#p").on("input", function (e) {
    e.preventDefault();
    resetInputs("p");
    const value = $(this).val();
    if (value !== "")
      setTimeout(() => {
        calculatePoints();
      }, 500);
  });

  // Event handler for select with ID "base"
  $("#base").on("change", function (e) {
    e.preventDefault();
    resetInputs("base");
    if (PointsChart.data.datasets.length > 1) {
      PointsChart.data.datasets.splice(1);
    }
    PointsChart.update();
    remarkBasePoint();
    if ($(this).val() !== "") {
      secrets.forEach((id) => {
        $(`#${id}`).prop("disabled", false);
      });
    }
  });
}

/// Generates the public keys
function generateDX(id) {
  const dx = $(`#${id}`).val();
  $.ajax({
    url: "/public",
    type: "POST",
    data: JSON.stringify({ dx, id }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data) {
      const { dxG, steps } = data;
      $(`#${id}G`).val(`(${dxG})`);

      const dataset_index = id === "dA" ? 1 : 2;
      PointsChart.data.datasets[dataset_index] = {
        type: "line",
        data: steps,
        backgroundColor: Array(steps.length).fill("rgba(189, 155, 25, 1)"),
        borderColor: "rgba(255, 240, 0, 1)",
        fill: false,
        animation: false,
        order: 0,
      };
      PointsChart.update();
      if ($("#dAG").val() && $("#dBG").val())
        generateShared();
    },
    error: function (err) {
      console.log(err);
    },
  });
}

/// Validates the private keys
function validateDX(id) {
  $(`#${id}`).on("input", function (e) {
    e.preventDefault();
    resetInputs(id);
    const dataset_index = id === "dA" ? 1 : id === "dB" ? 2 : undefined;
    if (dataset_index !== undefined) {
      PointsChart.data.datasets[dataset_index] = {};
      PointsChart.update();
      remarkBasePoint();
      if ($(this).val() !== "") {
        generateDX(id);
      } else {
        $("#shared").val("");
      }
    }
  });
}

/// Generates the shared key
function generateShared() {
  $.ajax({
    url: "/shared",
    type: "POST",
    data: JSON.stringify({
      dx: $("#dA").val(),
      dyG: $("#dBG").val(),
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data) {
      const shared = `(${data.shared})`;
      $("#shared").val(shared);
      $("#alphabet").prop("disabled", false);
      $("#message").prop("disabled", false);

      const index = PointsChart.data.datasets[0].data.findIndex((element) => {
        return element[0] === data.shared[0] && element[1] === data.shared[1];
      });

      if (index !== -1) {
        PointsChart.data.datasets[0].backgroundColor[index] =
          "rgba(147, 250, 165, 1)";
        PointsChart.data.datasets[0].pointRadius[index] = 7;
        PointsChart.update();
      }
    },
    error: function (err) {
      console.log(err);
    },
  });
}

/// Encrypts the message
function encrypt() {
  const alphabet = $("#alphabet").val();
  const message = $("#message").val();
  const reverse = $("#Switch").is(":checked");
  let dx, dyG;
  if (!reverse) {
    dx = $("#dB").val();
    dyG = $("#dAG").val();
  } else {
    dx = $("#dA").val();
    dyG = $("#dBG").val();
  }

  $.ajax({
    url: "/encrypt",
    type: "POST",
    data: JSON.stringify({ message, dx, dyG, alphabet }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data) {
      const { encoded, encrypted } = data;
      for (let i = 0; i < encoded.length; i++) {
        $("#encoded").append(`<div>(${encoded[i]})</div>`);
        $("#encrypted").append(`<div>((${encrypted[i][0]}), (${encrypted[i][1]}))</div>`);
      }
    },
    error: function (err) {
      console.log(err);
    },
  });
}

function validateAlphabetOptions() {
  const natural_language = ["alphabetic", "alphanumeric"];
  const natural_options = ["spanish", "case-insensitive"];
  const digital = ["binary", "decimal", "hexadecimal"];

  const alphabets = {
    alphabetic: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    binary: "01",
    decimal: "0123456789",
    hexadecimal: "0123456789ABCDEF"
  };

  natural_language.forEach((id) => {
    $(`#${id}`).on("click", function (e) {
      if ($(this).attr("aria-pressed") === "true") {
        digital.forEach((id) => {
          $(`#${id}`).prop("disabled", true);
        });
        $(`#alphabet`).val(alphabets[id]);
      } else {
        digital.forEach((id) => {
          $(`#${id}`).prop("disabled", false);
        });
      }
    });
  });

  $(`#case-insensitive`).on("click", function (e) {
    if (/[A-Z]/.test($("#alphabet").val())) {
      const letters = $("#alphabet").val().replace(/[0-9]/g, "");
      const numbers = $("#alphabet").val().replace(/[A-Z]/g, "");
      const characters = [...new Set(letters.toLowerCase() + letters.toUpperCase() + numbers)].join("");
      $("#alphabet").val(characters);
    }
  });

  $(`#spanish`).on("click", function (e) {
    if (/[A-Z]/.test($("#alphabet").val())) {
      // const
    }
  });

  digital.forEach((id) => {
    $(`#${id}`).on("click", function (e) {
      if ($(this).attr("aria-pressed") === "true") {
        natural_language.forEach((id) => {
          $(`#${id}`).prop("disabled", true);
        });
        digital.forEach((id) => {
          if (id !== $(this).attr("id")) $(`#${id}`).prop("disabled", true);
        });
        $(`#alphabet`).val(alphabets[id]);
        natural_options.forEach((id) => {
          $(`#${id}`).prop("disabled", true);
        });
      } else {
        natural_language.forEach((id) => {
          $(`#${id}`).prop("disabled", false);
        });
        digital.forEach((id) => {
          $(`#${id}`).prop("disabled", false);
        });
        natural_options.forEach((id) => {
          $(`#${id}`).prop("disabled", false);
        });
      }
    });
  });
}

function validateForms() {
  validateCurve();
  validateDX("dA");
  validateDX("dB");
  validateAlphabetOptions();
  $("#alphabet").on("change", function (e) {
    e.preventDefault();
  });
  $("#message").on("input", function (e) {
    e.preventDefault();
    setTimeout(() => {
      $("#encoded").html("");
      $("#encrypted").html("");
      encrypt();
    }, 1500);
  });
  $("#Switch").on("change", function (e) {
    e.preventDefault();
    setTimeout(() => {
      $("#encoded").html("");
      $("#encrypted").html("");
      encrypt();
    }, 1500);
  });
}

$(document).ready(function () {
  resizeCanvasElements();
  init_canvas();
  validateForms();
});
