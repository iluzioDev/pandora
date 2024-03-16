import Alphabet from "./modules/alphabet.js";
import Point from "./modules/point.js";
import * as utils from "./modules/utils.js";

const alphabet = new Alphabet();

var c_chart;
var p_chart;

const ids = ["a", "b"];
const secrets = ["dA", "dB"];

const config = {
    "range": 10,
    "step": 0.01,
    "threshold": 1e-6
}

$(document).ready(function () {
    utils.resizeCanvasElements();
    utils.init_canvas();
    validateForms();
});

function validateForms() {
    validateCurve();
    validateDX("dA");
    validateDX("dB");
    validateAlphabetOptions();
    $("#message, #Switch").on("change", function (e) {
        e.preventDefault();
        setTimeout(() => {
            $("#encoded").html("");
            $("#encrypted").html("");
            encrypt();
        }, 1500);
    });
}

/// Event listeners to validate Curve Properties inputs
function validateCurve() {
    ids.forEach((id) => {
        $(`#${id}`).on("input", function (e) {
            e.preventDefault();
            utils.reset(ids[ids.length - 1]);
            generateCurve();
        });
    });

    $("#p").on("input", function (e) {
        e.preventDefault();
        utils.reset("p");
        const value = $(this).val();
        if (value !== "")
            setTimeout(() => {
                calculatePoints();
            }, 500);
    });

    $("#base").on("change", function (e) {
        e.preventDefault();
        utils.reset("base");
        if (p_chart.data.datasets.length > 1)
            p_chart.data.datasets.splice(1);
        p_chart.update();
        remarkBase();
        if ($(this).val() !== "") {
            secrets.forEach((id) => {
                enable(`#${id}`);
            });
        }
    });
}

/// Function to destroy the charts
function destroy() {
    if (c_chart) c_chart.destroy();
    if (p_chart) p_chart.destroy();
}

/// Function to split the elliptic curve into segments in order to avoid sharp edges and display a smooth curve
function splitCurve(curve) {
    console.log(curve);
    for (let i = 0; i < curve.length - 1; ++i) {
        if (utils.distance(curve[i], curve[i + 1]) > 0.25) {
            const p1 = curve[i];
            const p2 = curve[i + 1];
            curve.splice(i + 1, 0, { x: p1.x + Math.abs(p1.x - curve[i - 1].x), y: 0 });
            curve.splice(i + 2, 0, { x: p2.x - Math.abs(p2.x - curve[i + 2].x), y: 0 });
            break;
        }
    }
    return curve;
}


/// Function to calculate the elliptic curve based on the given parameters
function calculateCurve(a, b) {
    let f_half = [];
    for (let x = -config.range; x <= config.range; x += config.step) {
        const expr = new Complex(x ** 3 + a * x + b);
        const sqrtExpr = expr.sqrt();
        if (!isNaN(sqrtExpr.re) && sqrtExpr.im === 0)
            f_half.push({ x, y: Math.round(Number(sqrtExpr.re) * 100) / 100 });
    }
    f_half = splitCurve(f_half);
    if (Math.abs(f_half[0].y) > config.threshold)
        f_half.unshift({ x: f_half[0].x - Math.abs((f_half[0].x - f_half[1].x) / 2), y: 0 });
    const s_half = f_half.map(p => ({ x: p.x, y: -p.y }));
    return [f_half, s_half];
}


/// Generate and display the elliptic curve on the canvas
function generateCurve() {
    const inputs = $("#a, #b").filter(":input").filter((i, el) => !el.value.trim());
    if (inputs.length) {
        disable("#p");
        return;
    }
    const data = JSON.stringify({ a: $("#a").val(), b: $("#b").val() });
    $.ajax(utils.ajaxObject("/curve", data, (result) => {
        destroy();
        const [f_half, s_half] = calculateCurve(parseInt($("#a").val()), parseInt($("#b").val()));
        const ctx = $("#Curve")[0].getContext("2d");
        c_chart = new Chart(ctx, {
            type: "line",
            data: {
                datasets: [utils.dsConfig(f_half), utils.dsConfig(s_half)],
            },
            options: utils.chartOptions(-10, 10, -10, 10, { point: { radius: 0 } })
        });
        enable("#p");
    }, (err) => {
        console.log(err);
    }));
}

/// Function to calculate the points on the elliptic curve
function calculatePoints() {
    const data = JSON.stringify({ p: $("#p").val() });
    $.ajax(utils.ajaxObject("/points", data, (result) => {
        const points = result.points.map(point => new Point(JSON.parse(point).x, JSON.parse(point).y));
        const x_max = Math.max(...points.map(({ x }) => x)) + 1;
        const y_max = Math.max(...points.map(({ y }) => y)) + 1;
        const ctx = $("#Points")[0].getContext("2d");
        p_chart?.destroy();
        p_chart = new Chart(ctx, {
            type: "scatter",
            data: {
                datasets: [{
                    data: points,
                    backgroundColor: "rgba(0, 0, 255, 1)",
                    order: 1,
                }],
            },
            options: utils.chartOptions(-1, x_max, -1, y_max),
        });
        enable("#base");
        $("#base").html('<option value="">Select base point</option>');
        points.forEach((point) => {
            $("#base").append(`<option value="${point}">${point}</option>`);
        });
    }, ({ status, responseJSON }) => {
        if (status == 400)
            utils.launchSwal("Oops...", responseJSON.error, "error");
        else
            alert("Something went wrong");
    }));
}

/// Function to remark the base point on the Points chart
function remarkBase() {
    $.ajax(utils.ajaxObject("/base", JSON.stringify({ base: $("#base").val() }), result => {
        result.points = result.points.map(point => new Point(JSON.parse(point).x, JSON.parse(point).y));
        result.base = new Point(JSON.parse(result.base).x, JSON.parse(result.base).y);
        const index = result.points.findIndex(point => point.equals(result.base));

        if (index !== -1) {
            const backgroundColors = p_chart.data.datasets[0].data.map((_, i) => i === index ? "rgba(255, 76, 48)" : "rgba(0, 0, 255, 1)");
            const pointRadius = p_chart.data.datasets[0].data.map((_, i) => i === index ? 7 : 4);
            p_chart.data.datasets[0].backgroundColor = backgroundColors;
            p_chart.data.datasets[0].pointRadius = pointRadius;
            p_chart.update();
        }
    }, (err) => {
        console.log(err);
    }));
}

/// Validates the private keys
function validateDX(id) {
    $(`#${id}`).on("input", function (e) {
        e.preventDefault();
        utils.reset(id);
        const dataset_index = id === "dA" ? 1 : id === "dB" ? 2 : undefined;
        if (dataset_index !== undefined) {
            p_chart.data.datasets[dataset_index] = {};
            p_chart.update();
            remarkBase();
            if ($(this).val() !== "") {
                generateDX(id);
            } else {
                $("#shared").val("");
            }
        }
    });
}

/// Generates the public keys
function generateDX(id) {
    const data = JSON.stringify({ dx: $(`#${id}`).val(), id });
    $.ajax(utils.ajaxObject("/public", data, (result) => {
        if (result.message === "Invalid private key") {
            $(`#${id}G`).val('(O)');
            return;
        }
        const dxG = new Point(JSON.parse(result.dxG).x, JSON.parse(result.dxG).y);
        const steps = result.steps.map(step => new Point(JSON.parse(step).x, JSON.parse(step).y));
        $(`#${id}G`).val(dxG);

        const dataset_index = id === "dA" ? 1 : 2;
        p_chart.data.datasets[dataset_index] = {
            type: "line",
            data: steps,
            backgroundColor: Array(steps.length).fill("rgba(189, 155, 25, 1)"),
            borderColor: "rgba(255, 240, 0, 1)",
            fill: false,
            animation: false,
            order: 0,
        };
        p_chart.update();
        if ($("#dAG").val() && $("#dBG").val())
            generateShared();
    }, (err) => {
        console.log(err);
    }));
}

/// Generates the shared key
function generateShared() {
    $.ajax(utils.ajaxObject("/shared", JSON.stringify({ dx: $("#dA").val(), dyG: $("#dBG").val() }), (result) => {
        if (result.message === "Invalid private key") {
            $("#shared").val('(O)');
            return;
        }
        const shared = new Point(JSON.parse(result.shared).x, JSON.parse(result.shared).y);
        $("#shared").val(shared);
        enable("#alphabet");
        enable("#message");

        const index = p_chart.data.datasets[0].data.findIndex((element) => {
            return element.equals(shared);
        });

        if (index !== -1) {
            p_chart.data.datasets[0].backgroundColor[index] =
                "rgba(147, 250, 165, 1)";
            p_chart.data.datasets[0].pointRadius[index] = 7;
            p_chart.update();
        }
    }, (err) => {
        console.log(err);
    }));
}

/// Encrypts the message
function encrypt() {
    const alphabet = $("#alphabet").val();
    const message = $("#message").val();
    const reverse = $("#Switch").is(":checked");
    const dx = reverse ? $("#dA").val() : $("#dB").val();
    const dyG = reverse ? $("#dBG").val() : $("#dAG").val();

    const data = JSON.stringify({ message, dx, dyG, alphabet });
    $.ajax(utils.ajaxObject("/encrypt", data, (result) => {
        const encoded = result.encoded.map(point => new Point(JSON.parse(point).x, JSON.parse(point).y));
        const encrypted = result.encrypted.map(point => [new Point(JSON.parse(point[0]).x, JSON.parse(point[0]).y), new Point(JSON.parse(point[1]).x, JSON.parse(point[1]).y)]);
        console.log(encoded, encrypted);
        for (let i = 0; i < message.length; i++) {
            $("#characters").append(`<div>${message[i]}</div>`);
            $("#encoded").append(`<div>${encoded[i]}</div>`);
            $("#encrypted").append(`<div>(${encrypted[i][0]}, ${encrypted[i][1]})</div>`);
        }
    }, (err) => {
        console.log(err);
    }));
}

function validateAlphabetOptions() {
    const alph_buttons = alphabet.getTypes().concat(alphabet.getOptions());
    console.log(alph_buttons);
    alph_buttons.forEach((id) => {
        $(`#${id}`).on("mousedown", function (e) {
            e.preventDefault();
            console.log(id, alphabet.types);
            if (id in alphabet.types) {
                alphabet.value = alphabet.types[id].value;
                if (alphabet.types[id].numeric_system) {
                    alphabet.options["alphanumeric"] = false;
                    alphabet.options["case-sensitive"] = true;
                    alph_buttons.forEach((i) => {
                        if (i !== id)
                            disable(`#${i}`);
                    });
                }
            } else {
                alphabet.options[id] = true;
                alph_buttons.forEach((i) => {
                    if (i !== id && i in alphabet.types && alphabet.types[i].numeric_system)
                        $(`#${i}`).prop("disabled", !alphabet.options[id]);
                });
            }
            console.log(alphabet.value);
            alphabet.check_options();
            console.log(alphabet.value);
            $("#alphabet").val([...alphabet.value].join(""));
        });

    });
    alph_buttons.forEach((id) => {
        $(`#${id}`).on("mouseup", function (e) {
            e.preventDefault();
            if (id in alphabet.types) {
                alph_buttons.forEach((i) => {
                    if (i !== id)
                        enable(`#${i}`);
                });
            }
            if (id in alphabet.options) {
                alphabet.options[id] = false;
                alphabet.getOptions().forEach((i) => {
                    if (i !== id)
                        enable(`#${i}`);
                });
            }
        });
    });
}
