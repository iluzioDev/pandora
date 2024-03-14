/// Function to initialize canvas elements
export function init_canvas() {
    Chart.defaults.elements.point.radius = 4;
    Chart.defaults.elements.point.hoverRadius = 7;
    Chart.defaults.elements.point.borderWidth = 0;
}

/// Function to create the dataset configuration for the elliptic curve
export function dsConfig(data) {
    const skipped = (ctx, value) =>
        ctx.p0.parsed.y === 0 && ctx.p1.parsed.y === 0 ? value : undefined;
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
export function axisConfig(type, position, min, max) {
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

/// Function to create the chart options for the elliptic curve
export function chartOptions (x_min, x_max, y_min, y_max, elements = {}) {
    return {
        events: [],
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            x: axisConfig("linear", "bottom", x_min, x_max),
            y: axisConfig("linear", "left", y_min, y_max),
        },
        elements: elements
    };
}

/// Function to resize all canvas elements for responsive design
export function resizeCanvasElements() {
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

/// Function to calculate distance between two points
export function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/// Function to reset inputs after a certain point
export function reset(startpoint) {
    const inputElements = Array.from($("input, select")).filter(function (element) {
        return element.id !== "encoded_message" && element.id !== "encrypted_message";
    });

    const excluded =
        startpoint === "dA"
            ? ["dB", "dBG", "shared"]
            : startpoint === "dB"
                ? ["dA", "dAG", "shared"]
                : [];

    const startpointIndex = inputElements.findIndex(
        (element) => element.id === startpoint
    );

    for (let i = startpointIndex + 1; i < inputElements.length; i++) {
        const currentId = inputElements[i].id;
        if (currentId === "Switch") continue;
        if (!excluded.includes(currentId)) {
            inputElements[i].value = "";
            inputElements[i].disabled = true;
            if (currentId === "base")
                inputElements[i].innerHTML = "";
            if (currentId === "alphabet") {
                inputElements[i].value = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            }
        }
    }
    $("#encoded").html("");
    $("#encrypted").html("");
}

export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function launchSwal(title, text, icon) {
    Swal.fire({
        title: title,
        text: text,
        icon: icon,
    });
}

export function ajaxObject(url, data, success, error, method = "POST") {
    return {
        type: method,
        url: url,
        data: data,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: success,
        error: error,
    };
}
