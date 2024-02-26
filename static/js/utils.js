let CurveChart, PointsChart;

const ids = ["a", "b"];
const secrets = ["dA", "dB"];
const inputElements = Array.from($("input, select")).filter(function (element) {
  return element.id !== "encoded_message" && element.id !== "encrypted_message";
});

const range = 10;
const step = 0.01;
const threshold = 1e-6;

const skipped = (ctx, value) =>
  ctx.p0.parsed.y === 0 && ctx.p1.parsed.y === 0 ? value : undefined;
/// Function to initialize canvas elements
function init_canvas() {
  Chart.defaults.elements.point.radius = 4;
  Chart.defaults.elements.point.hoverRadius = 7;
  Chart.defaults.elements.point.borderWidth = 0;
}

/// Function to destroy the charts
function destroyCharts() {
  if (CurveChart) CurveChart.destroy();
  if (PointsChart) PointsChart.destroy();
}

/// Function to create the dataset configuration for the elliptic curve
function createDatasetConfig(data) {
  return {
    data: data,
    borderColor: "rgba(255, 99, 132, 1)",
    fill: true,
    tension: 0.4,
    segment: {
      borderColor: (ctx) => skipped(ctx, "rgba(0, 0, 0, 0)"),
    },
  };
}

/// Function to create the axis configuration for the elliptic curve
function createAxisConfig(type, position, min, max) {
  return {
    type: type,
    position: position,
    ticks: {
      stepSize: 1,
    },
    min: min,
    max: max,
  };
}

/// Function to resize all canvas elements for responsive design
function resizeCanvasElements() {
  $("canvas").each(function () {
    const parent = $(this).parent();
    const paddingLeft = parseInt(parent.css("padding-left"));
    const paddingTop = parseInt(parent.css("padding-top"));

    const canvasWidth = parent.width() - paddingLeft * 2 - 2;
    const canvasHeight = parent.height() - paddingTop * 2;

    $(this).attr("width", canvasWidth);
    $(this).attr("height", canvasWidth * 0.6);
    parent.css("height", `${canvasWidth * 0.6}px`);
  });
}

/// Function to reset inputs after a certain point
function resetInputs(startpoint) {
  const excluded =
    startpoint === "dA"
      ? ["dB", "public_key_dB", "shared_key"]
      : startpoint === "dB"
      ? ["dA", "public_key_dA", "shared_key"]
      : [];

  const startpointIndex = inputElements.findIndex(
    (element) => element.id === startpoint
  );

  for (let i = startpointIndex + 1; i < inputElements.length; i++) {
    const currentId = inputElements[i].id;
    if (!excluded.includes(currentId)) {
      inputElements[i].value = "";
      inputElements[i].disabled = true;
      if (currentId === "base_point")
        inputElements[i].innerHTML = "";
      if (currentId === "alphabet")
        inputElements[i].value = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    }
  }

}
