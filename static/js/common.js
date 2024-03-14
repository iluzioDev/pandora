// Function to load HTML content from a file and insert it into a target element
function loadHTMLContent(url, targetElement) {
  $.get(url, function (content) {
    $(targetElement).html(content);
  });
}

loadHTMLContent("/static/html/header.html", "header");
loadHTMLContent("/static/html/footer.html", "footer");

// Set input elements' name attribute to their respective id using jQuery
$("input, select").each(function () {
  $(this).attr("name", this.id);
});

function enable(element) {
  $(element).prop("disabled", false);
}

function disable(element) {
  $(element).prop("disabled", true);
}
