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
    url: "/generate-curve",
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
    url: "/calculate-points",
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
      const base_point = $("#base_point");
      base_point.prop("disabled", false);
      base_point.html('<option value="">Select base point</option>');
      data.points.forEach((point) => {
        base_point.append(`<option value="${point}">(${point})</option>`);
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
    url: "/base-point",
    type: "POST",
    data: JSON.stringify({ base_point: $("#base_point").val() }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data) {
      const index = data.points.findIndex(
        (p) => p[0] === data.base_point[0] && p[1] === data.base_point[1]
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
    if (value !== "") {
      calculatePoints();
    }
  });

  // Event handler for select with ID "base_point"
  $("#base_point").on("change", function (e) {
    e.preventDefault();
    resetInputs("base_point");
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
  const private_key = $(`#${id}`).val();
  $.ajax({
    url: "/generate-key",
    type: "POST",
    data: JSON.stringify({ private_key }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data) {
      const { key, steps } = data;
      $(`#public_key_${id}`).val(`(${key})`);

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
      if ($("#public_key_dA").val() && $("#public_key_dB").val())
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
        $("#shared_key").val("");
      }
    }
  });
}

/// Generates the shared key
function generateShared() {
  $.ajax({
    url: "/generate-key",
    type: "POST",
    data: JSON.stringify({
      private_key: $("#dA").val(),
      public_key: $("#public_key_dB").val(),
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data) {
      const key = `(${data.key})`;
      $("#shared_key").val(key);
      $("#alphabet").prop("disabled", false);
      $("#message").prop("disabled", false);

      const index = PointsChart.data.datasets[0].data.findIndex((element) => {
        return element[0] === data.key[0] && element[1] === data.key[1];
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
  const dA = $("#dA").val();
  const dB = $("#dB").val();

  if (message === "") return;
  const reverse = $("#reverse").is(":checked");

  $.ajax({
    url: "/encrypt",
    type: "POST",
    data: JSON.stringify({ message, dA, dB, alphabet, reverse }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data) {
      const { encoded, encrypted } = data;
      $("#msgs").children().first().prop("hidden", true);
      for (let i = 0; i < encoded.length; i++)
        $("#msgs").append(`<div class="row"><div> ${encoded[i]} </div> <div> ${encrypted[i]} </div></div>`);
    },
    error: function (err) {
      console.log(err);
    },
  });
}

function validateForms() {
  validateCurve();
  validateDX("dA");
  validateDX("dB");
  $("#alphabet").on("change", function (e) {
    e.preventDefault();
    resetInputs("alphabet");
  });
  $("#message").on("input", function (e) {
    e.preventDefault();
    encrypt();
  });
}

$(document).ready(function () {
  resizeCanvasElements();
  init_canvas();
  validateForms();
});
