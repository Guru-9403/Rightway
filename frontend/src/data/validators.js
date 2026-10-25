import { checkSyntaxError, hasTagFn } from "../utils/htmlTools";

// ---- HTML validators ----
function validateTask(code) { code = code || ""; const syntaxError = checkSyntaxError(code); const aMatch = code.match(/<a\s+[^>]*>/i); const imgMatch = code.match(/<img\s+[^>]*>/i); return [{ id: "h1", label: "Add one main heading using the <h1> tag.", ok: hasTagFn(code, "h1") }, { id: "p", label: "Add one paragraph using the <p> tag.", ok: hasTagFn(code, "p") }, { id: "a", label: "Add one hyperlink using the <a> tag with an href attribute.", ok: !!aMatch && /href\s*=/i.test(aMatch[0]) }, { id: "img", label: "Add one image using the <img> tag with src and alt attributes.", ok: !!imgMatch && /src\s*=/i.test(imgMatch[0]) && /alt\s*=/i.test(imgMatch[0]) }, { id: "br", label: "Add a line break using the <br> tag.", ok: hasTagFn(code, "br") }, { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !syntaxError }]; }
function validateStructureTask(code) { code = code || ""; const syntaxError = checkSyntaxError(code); const titleMatch = code.match(/<title[^>]*>([\s\S]*?)<\/title>/i); return [{ id: "doctype", label: "Start the page with a <!DOCTYPE html> declaration.", ok: /<!DOCTYPE\s+html\s*>/i.test(code) }, { id: "html", label: "Wrap the page in an <html> tag.", ok: /<html[\s>]/i.test(code) && /<\/html>/i.test(code) }, { id: "head", label: "Add a <head> section.", ok: /<head[\s>]/i.test(code) && /<\/head>/i.test(code) }, { id: "title", label: "Add a <title> tag inside <head> with some text in it.", ok: !!titleMatch && titleMatch[1].trim().length > 0 }, { id: "body", label: "Add a <body> section.", ok: /<body[\s>]/i.test(code) && /<\/body>/i.test(code) }, { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !syntaxError }]; }
function validateElementsTask(code) { code = code || ""; const syntaxError = checkSyntaxError(code); const divMatch = code.match(/<div[^>]*>[\s\S]*?<\/div>/i); return [{ id: "div", label: "Add a <div> container element.", ok: hasTagFn(code, "div") }, { id: "span", label: "Add a <span> element for inline text.", ok: hasTagFn(code, "span") }, { id: "strong", label: "Use <strong> to mark important text.", ok: hasTagFn(code, "strong") }, { id: "em", label: "Use <em> to mark emphasized text.", ok: hasTagFn(code, "em") }, { id: "nested", label: "Nest at least one other element inside your <div>.", ok: !!divMatch && /<(span|strong|em|p|h[1-6])[\s>]/i.test(divMatch[0]) }, { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !syntaxError }]; }
function validateAttributesTask(code) { code = code || ""; const syntaxError = checkSyntaxError(code); const aMatch = code.match(/<a\s+[^>]*>/i); const imgMatch = code.match(/<img\s+[^>]*>/i); return [{ id: "href", label: "Add an href attribute to the <a> tag.", ok: !!aMatch && /href\s*=/i.test(aMatch[0]) }, { id: "src", label: "Add a src attribute to the <img> tag.", ok: !!imgMatch && /src\s*=/i.test(imgMatch[0]) }, { id: "alt", label: "Add an alt attribute to the <img> tag.", ok: !!imgMatch && /alt\s*=/i.test(imgMatch[0]) }, { id: "id", label: "Add an id attribute to any element.", ok: /\sid\s*=/i.test(code) }, { id: "class", label: "Add a class attribute to any element.", ok: /\sclass\s*=/i.test(code) }, { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !syntaxError }]; }
function validateHeadingsTask(code) { code = code || ""; return [{ id: "h1", label: "Include one <h1> element.", ok: hasTagFn(code, "h1") }, { id: "h2", label: "Include at least one <h2> element.", ok: hasTagFn(code, "h2") }, { id: "h3", label: "Include at least one <h3> element.", ok: hasTagFn(code, "h3") }, { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !checkSyntaxError(code) }]; }
function validateParagraphsTask(code) { code = code || ""; return [{ id: "p", label: "Include a <p> element.", ok: hasTagFn(code, "p") }, { id: "hr", label: "Include an <hr> tag to separate content.", ok: hasTagFn(code, "hr") }, { id: "pre", label: "Include a <pre> element for preformatted text.", ok: hasTagFn(code, "pre") }, { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !checkSyntaxError(code) }]; }
function validateLinksTask(code) { code = code || ""; const aMatches = code.match(/<a\s+[^>]*>/gi) || []; return [{ id: "a", label: "Include at least two <a> elements.", ok: aMatches.length >= 2 }, { id: "target", label: "Use the target=\"_blank\" attribute on at least one link.", ok: /target\s*=\s*(["'])_blank\1/i.test(code) }, { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !checkSyntaxError(code) }]; }
function validateImagesTask(code) { code = code || ""; const imgMatch = code.match(/<img\s+[^>]*>/i); return [{ id: "img", label: "Include an <img> element.", ok: !!imgMatch }, { id: "alt", label: "Ensure the image has an alt attribute.", ok: !!imgMatch && /alt\s*=/i.test(imgMatch[0]) }, { id: "width", label: "Ensure the image has a width attribute.", ok: !!imgMatch && /width\s*=/i.test(imgMatch[0]) }, { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !checkSyntaxError(code) }]; }
function validateListsTask(code) { code = code || ""; return [{ id: "ul", label: "Include an Unordered List (<ul>).", ok: hasTagFn(code, "ul") }, { id: "ol", label: "Include an Ordered List (<ol>).", ok: hasTagFn(code, "ol") }, { id: "li", label: "Include at least 4 List Items (<li>) across your lists.", ok: (code.match(/<li[\s>]/gi) || []).length >= 4 }, { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !checkSyntaxError(code) }]; }
function validateFormsTask(code) { code = code || ""; return [{ id: "form", label: "Include a <form> element.", ok: hasTagFn(code, "form") }, { id: "input", label: "Include an <input> element.", ok: hasTagFn(code, "input") }, { id: "label", label: "Include a <label> element.", ok: hasTagFn(code, "label") }, { id: "button", label: "Include a <button> element to submit the form.", ok: hasTagFn(code, "button") }, { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !checkSyntaxError(code) }]; }
// ---- CSS validators ----
function validateCssBasicsTask(code) { code = code || ""; return [{ id: "style", label: "Include a <style> tag in the <head>.", ok: /<style[\s>]/i.test(code) }, { id: "h1-sel", label: "Target the h1 element.", ok: /h1\s*\{/i.test(code) }, { id: "color", label: "Set the color to blue.", ok: /h1\s*\{[^}]*color\s*:\s*blue\s*;?[^}]*\}/i.test(code) }]; }
function validateCssSelectorsTask(code) { code = code || ""; return [{ id: "class", label: "Target the .highlight class and make it yellow.", ok: /\.highlight\s*\{[^}]*color\s*:\s*yellow\s*;?[^}]*\}/i.test(code) }, { id: "id", label: "Target the #main-title ID and make it 40px font-size.", ok: /#main-title\s*\{[^}]*font-size\s*:\s*40px\s*;?[^}]*\}/i.test(code) }]; }
function validateCssBoxModelTask(code) { code = code || ""; return [{ id: "border", label: "Add a solid black border to the div.", ok: /div\s*\{[^}]*border\s*:\s*[^;]*solid[^;]*black[^;]*;?[^}]*\}/i.test(code) }, { id: "padding", label: "Add 20px padding to the div.", ok: /div\s*\{[^}]*padding\s*:\s*20px\s*;?[^}]*\}/i.test(code) }, { id: "margin", label: "Add 30px margin to the div.", ok: /div\s*\{[^}]*margin\s*:\s*30px\s*;?[^}]*\}/i.test(code) }]; }
function validateCssTypographyTask(code) { code = code || ""; return [{ id: "ff", label: "Set font-family to Arial.", ok: /font-family\s*:\s*Arial/i.test(code) }, { id: "fs", label: "Set font-size to 24px.", ok: /font-size\s*:\s*24px/i.test(code) }, { id: "ta", label: "Center the text with text-align.", ok: /text-align\s*:\s*center/i.test(code) }]; }
function validateCssColorsTask(code) { code = code || ""; return [{ id: "bgc", label: "Set background-color using a hex code.", ok: /background-color\s*:\s*#[0-9a-fA-F]{3,6}/i.test(code) }, { id: "c", label: "Set text color using rgb().", ok: /[^a-z-]color\s*:\s*rgb\(/i.test(code) }]; }
function validateCssFlexTask(code) { code = code || ""; return [{ id: "df", label: "Use display: flex on the container.", ok: /\.container\s*\{[^}]*display\s*:\s*flex/i.test(code) }, { id: "jc", label: "Use justify-content: space-between.", ok: /justify-content\s*:\s*space-between/i.test(code) }]; }
function validateCssFlexAlignTask(code) { code = code || ""; return [{ id: "ai", label: "Use align-items: center.", ok: /align-items\s*:\s*center/i.test(code) }, { id: "fd", label: "Use flex-direction: column.", ok: /flex-direction\s*:\s*column/i.test(code) }]; }
function validateCssGridTask(code) { code = code || ""; return [{ id: "dg", label: "Use display: grid.", ok: /display\s*:\s*grid/i.test(code) }, { id: "gtc", label: "Use grid-template-columns to make 3 columns.", ok: /grid-template-columns\s*:\s*([^;]+)/i.test(code) }]; }
function validateCssPositionTask(code) { code = code || ""; return [{ id: "posr", label: "Use position: relative on the parent.", ok: /\.parent\s*\{[^}]*position\s*:\s*relative/i.test(code) }, { id: "posa", label: "Use position: absolute on the child.", ok: /\.child\s*\{[^}]*position\s*:\s*absolute/i.test(code) }]; }
function validateCssDisplayTask(code) { code = code || ""; return [{ id: "none", label: "Use display: none to hide the box.", ok: /\.box\s*\{[^}]*display\s*:\s*none/i.test(code) }]; }
function validateCssResponsiveTask(code) { code = code || ""; return [{ id: "mq", label: "Create a @media query for max-width 600px.", ok: /@media\s*\([^)]*max-width\s*:\s*600px\)/i.test(code) }, { id: "bg", label: "Change the background color inside the media query.", ok: /@media[^\{]+\{[^}]*background-color\s*:/i.test(code) }]; }
function validateCssTransitionsTask(code) { code = code || ""; return [{ id: "tr", label: "Add a transition property to the button.", ok: /button\s*\{[^}]*transition\s*:/i.test(code) }, { id: "hov", label: "Use the :hover pseudo-class to change the background color.", ok: /button:hover\s*\{[^}]*background-color\s*:/i.test(code) }]; }
// ---- JavaScript validators ----
function validateJsBasicsTask(code) { code = code || ""; return [{ id: "script", label: "Include a <script> tag.", ok: /<script[\s>]/i.test(code) }, { id: "log", label: "Call console.log().", ok: /console\.log\s*\(/i.test(code) }]; }
function validateJsVarsTask(code) { code = code || ""; return [{ id: "letconst", label: "Declare variables using let or const.", ok: /(let|const)\s+[a-zA-Z_$]/i.test(code) }, { id: "log", label: "Log the variable to console.", ok: /console\.log\s*\(/i.test(code) }]; }
function validateJsFuncsTask(code) { code = code || ""; return [{ id: "fn", label: "Define a function.", ok: /function\s+[a-zA-Z_$]/i.test(code) || /const\s+[a-zA-Z_$]+\s*=\s*\(/i.test(code) }, { id: "ret", label: "Return a value or log from the function.", ok: /return\s+/i.test(code) || /console\.log/i.test(code) }]; }
function validateJsCondsTask(code) { code = code || ""; return [{ id: "if", label: "Use an if statement.", ok: /if\s*\(/i.test(code) }, { id: "else", label: "Use an else block.", ok: /else\s*\{/i.test(code) }]; }
function validateJsDomTask(code) { code = code || ""; return [{ id: "getelem", label: "Select element with document.getElementById.", ok: /document\.getElementById\s*\(/i.test(code) }, { id: "textc", label: "Modify textContent or innerHTML.", ok: /\.(textContent|innerHTML)\s*=/i.test(code) }]; }
function validateJsEventsTask(code) { code = code || ""; return [{ id: "evt", label: "Add a click listener with addEventListener or onclick.", ok: /addEventListener\s*\(\s*(['"])click\1/i.test(code) || /onclick\s*=/i.test(code) }]; }

// ---- Medical Coding validators ----
function validateMedicalBasicsTask(code) {
  code = code || "";
  return [
    { id: "chart", label: "Include patient chart container with patient details.", ok: /patient-chart/i.test(code) },
    { id: "diagnosis", label: "Include diagnosis text and code J02.9.", ok: /J02\.9/i.test(code) },
    { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !checkSyntaxError(code) }
  ];
}
function validateIcd10Task(code) {
  code = code || "";
  return [
    { id: "entry", label: "Include diagnosis entry with class 'diagnosis-entry'.", ok: /diagnosis-entry/i.test(code) },
    { id: "code", label: "Assign the correct ICD-10 code E11.9 in code-box.", ok: /code-box/i.test(code) && /E11\.9/i.test(code) },
    { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !checkSyntaxError(code) }
  ];
}
function validateCptTask(code) {
  code = code || "";
  return [
    { id: "proc", label: "Include procedure entry with class 'procedure-entry'.", ok: /procedure-entry/i.test(code) },
    { id: "cpt", label: "Assign the standard 5-digit CPT code 99213 in code-box.", ok: /code-box/i.test(code) && /99213/.test(code) },
    { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !checkSyntaxError(code) }
  ];
}
function validateHcpcsTask(code) {
  code = code || "";
  return [
    { id: "hcpcs", label: "Include HCPCS code K0001 in 'hcpcs-code' container.", ok: /hcpcs-code/i.test(code) && /K0001/i.test(code) },
    { id: "mod", label: "Include a 2-character modifier (e.g. RT or LT) in 'modifier'.", ok: /modifier/i.test(code) && /(RT|LT|50|25)/i.test(code) },
    { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !checkSyntaxError(code) }
  ];
}
function validateBillingTask(code) {
  code = code || "";
  return [
    { id: "claim", label: "Include a claim form with class 'claim-form'.", ok: /claim-form/i.test(code) },
    { id: "npi", label: "Include a 10-digit National Provider Identifier (NPI).", ok: /NPI:\s*\d{10}/i.test(code) },
    { id: "status", label: "Set claim status to CLEAN_CLAIM.", ok: /CLEAN_CLAIM/i.test(code) },
    { id: "syntax", label: "Your HTML tags must be properly opened and closed.", ok: !checkSyntaxError(code) }
  ];
}

export const VALIDATORS = { validateTask, validateStructureTask, validateElementsTask, validateAttributesTask, validateHeadingsTask, validateParagraphsTask, validateLinksTask, validateImagesTask, validateListsTask, validateFormsTask, validateCssBasicsTask, validateCssSelectorsTask, validateCssBoxModelTask, validateCssTypographyTask, validateCssColorsTask, validateCssFlexTask, validateCssFlexAlignTask, validateCssGridTask, validateCssPositionTask, validateCssDisplayTask, validateCssResponsiveTask, validateCssTransitionsTask, validateJsBasicsTask, validateJsVarsTask, validateJsFuncsTask, validateJsCondsTask, validateJsDomTask, validateJsEventsTask, validateMedicalBasicsTask, validateIcd10Task, validateCptTask, validateHcpcsTask, validateBillingTask };
