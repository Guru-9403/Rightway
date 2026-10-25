/* ============================================================
   LESSON STARTER CODE & QUIZZES
   ============================================================ */

// ---- HTML (1-10) ----
const L1_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n    <title>My HTML Page</title>\n</head>\n<body>\n\n</body>\n</html>`;
const L1_QUIZ = [{ q: "Which HTML tag is used to create the main heading of a page?", options: ["<h1>", "<p>", "<a>", "<br>"], correct: "<h1>" }, { q: "Which tag is used to create a paragraph?", options: ["<p>", "<h1>", "<img>", "<a>"], correct: "<p>" }, { q: "Which HTML tag creates a hyperlink?", options: ["<link>", "<a>", "<href>", "<nav>"], correct: "<a>" }, { q: "Which tag is used to display an image?", options: ["<picture>", "<img>", "<image>", "<photo>"], correct: "<img>" }, { q: "Which HTML tag creates a line break?", options: ["<break>", "<line>", "<br>", "<hr>"], correct: "<br>" }];
const L2_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n\n</head>\n<body>\n\n</body>\n</html>`;
const L2_QUIZ = [{ q: "Which declaration must be the very first line of an HTML document?", options: ["<!DOCTYPE html>", "<html>", "<head>", "<document>"], correct: "<!DOCTYPE html>" }, { q: "Which tag wraps all the visible content of a page?", options: ["<head>", "<body>", "<html>", "<content>"], correct: "<body>" }, { q: "Where does the <title> tag belong?", options: ["Inside <body>", "Inside <head>", "Before <!DOCTYPE html>", "Anywhere in the file"], correct: "Inside <head>" }, { q: "What does the <head> section mainly contain?", options: ["Visible page content", "Page metadata like the title", "Images only", "Links only"], correct: "Page metadata like the title" }, { q: "Which tag is the outermost element that contains <head> and <body>?", options: ["<html>", "<body>", "<head>", "<page>"], correct: "<html>" }];
const L3_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n    <title>HTML Elements</title>\n</head>\n<body>\n\n</body>\n</html>`;
const L3_QUIZ = [{ q: "Which of these is a block-level element that starts on a new line?", options: ["<span>", "<div>", "<strong>", "<em>"], correct: "<div>" }, { q: "Which tag groups inline content without adding a line break?", options: ["<div>", "<p>", "<span>", "<section>"], correct: "<span>" }, { q: "Which tag marks text as important, usually shown in bold?", options: ["<em>", "<strong>", "<b-text>", "<important>"], correct: "<strong>" }, { q: "Which tag marks text as emphasized, usually shown in italics?", options: ["<em>", "<strong>", "<i-text>", "<italic>"], correct: "<em>" }, { q: "What does it mean to 'nest' an HTML element?", options: ["Give it a CSS class", "Place one element inside another", "Close it with a self-closing slash", "Add it to the <head>"], correct: "Place one element inside another" }];
const L4_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n    <title>HTML Attributes</title>\n</head>\n<body>\n    <a>Visit OpenAI</a>\n    <br><br>\n    <img>\n    <p>Style me!</p>\n</body>\n</html>`;
const L4_QUIZ = [{ q: "Where are HTML attributes always placed?", options: ["In the closing tag", "In the opening tag", "Between the opening and closing tags", "In the <head> section"], correct: "In the opening tag" }, { q: "Which attribute is used to specify the destination URL of a link?", options: ["src", "link", "href", "url"], correct: "href" }, { q: "Which attribute specifies the path to an image file?", options: ["src", "href", "alt", "path"], correct: "src" }, { q: "What is the primary purpose of the 'alt' attribute on an image?", options: ["To make the image load faster", "To style the image", "To provide alternative text if the image fails to load", "To change the image size"], correct: "To provide alternative text if the image fails to load" }, { q: "Which attribute is used to uniquely identify a single element on the page?", options: ["class", "id", "name", "unique"], correct: "id" }];
const L5_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n    <title>Headings</title>\n</head>\n<body>\n    <!-- Add your headings below -->\n\n</body>\n</html>`;
const L5_QUIZ = [{ q: "How many levels of headings does HTML provide?", options: ["4", "5", "6", "7"], correct: "6" }, { q: "Which heading tag is the most important?", options: ["<h1>", "<h6>", "<header>", "<h-main>"], correct: "<h1>" }, { q: "Which heading tag is the least important (smallest by default)?", options: ["<h1>", "<h7>", "<h6>", "<small>"], correct: "<h6>" }, { q: "Why are headings important for a web page?", options: ["They make text blue", "They hide text from users", "They structure content for users and search engines", "They load pages faster"], correct: "They structure content for users and search engines" }, { q: "Should you use heading tags just to make text bold or big?", options: ["Yes, it saves time", "No, use CSS for styling instead", "Yes, if it's a short paragraph", "No, unless it's inside a list"], correct: "No, use CSS for styling instead" }];
const L6_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n    <title>Paragraphs</title>\n</head>\n<body>\n    <!-- Add paragraphs, hr, and pre here -->\n\n</body>\n</html>`;
const L6_QUIZ = [{ q: "What happens if you add multiple spaces inside a <p> tag?", options: ["The browser displays them all", "The browser collapses them into a single space", "It causes an error", "It creates a line break"], correct: "The browser collapses them into a single space" }, { q: "Which tag preserves both spaces and line breaks exactly as written?", options: ["<p>", "<code>", "<pre>", "<format>"], correct: "<pre>" }, { q: "What does the <hr> tag do?", options: ["Creates a hyperlink", "Highlights text", "Creates a thematic break (horizontal line)", "Hides text"], correct: "Creates a thematic break (horizontal line)" }, { q: "Is <hr> a void (self-closing) element?", options: ["Yes", "No", "Only in old HTML", "Only inside a div"], correct: "Yes" }, { q: "Which tag is best for standard text blocks?", options: ["<span>", "<p>", "<div>", "<text>"], correct: "<p>" }];
const L7_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n    <title>Links</title>\n</head>\n<body>\n    <!-- Add a link to google.com that opens in a new tab, and a relative link -->\n\n</body>\n</html>`;
const L7_QUIZ = [{ q: "Which attribute tells the browser where to open a link?", options: ["src", "target", "href", "open"], correct: "target" }, { q: "What is the value to open a link in a new tab?", options: ["_new", "_blank", "_tab", "_window"], correct: "_blank" }, { q: "What is an absolute URL?", options: ["A full web address including https://", "A local file path", "A link that never breaks", "A link with a target"], correct: "A full web address including https://" }, { q: "What is a relative URL?", options: ["A full web address", "A link to a page within the same website", "A link to a family member's site", "An image link"], correct: "A link to a page within the same website" }, { q: "Can you link to an email address?", options: ["Yes, using mailto: inside href", "No, HTML doesn't support it", "Yes, using email: inside target", "Yes, but only with PHP"], correct: "Yes, using mailto: inside href" }];
const L8_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n    <title>Images</title>\n</head>\n<body>\n    <!-- Add an image with a src, alt, and width attribute -->\n\n</body>\n</html>`;
const L8_QUIZ = [{ q: "Which attribute specifies the image file path?", options: ["href", "src", "link", "path"], correct: "src" }, { q: "Why is the alt attribute crucial?", options: ["It adds a border", "It changes the color", "It provides fallback text for accessibility", "It speeds up loading"], correct: "It provides fallback text for accessibility" }, { q: "Does the <img> tag need a closing tag (e.g. </img>)?", options: ["Yes, always", "No, it is an empty/void element", "Only if it has no alt attribute", "Only in HTML4"], correct: "No, it is an empty/void element" }, { q: "Which attributes can adjust the size of an image directly in HTML?", options: ["size and scale", "x and y", "width and height", "big and small"], correct: "width and height" }, { q: "What happens if an image fails to load and has an alt attribute?", options: ["The page crashes", "A blank space appears", "The alt text is displayed", "It redirects to Google"], correct: "The alt text is displayed" }];
const L9_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n    <title>Lists</title>\n</head>\n<body>\n    <!-- Create one ordered list and one unordered list below -->\n\n</body>\n</html>`;
const L9_QUIZ = [{ q: "Which tag creates a bulleted list?", options: ["<ol>", "<ul>", "<li>", "<dl>"], correct: "<ul>" }, { q: "Which tag creates a numbered list?", options: ["<ol>", "<ul>", "<li>", "<nl>"], correct: "<ol>" }, { q: "What tag must be used for the items inside a list?", options: ["<item>", "<li>", "<ul>", "<ol>"], correct: "<li>" }, { q: "Can you put a list inside another list (nesting)?", options: ["No, it's forbidden", "Yes, by putting a ul/ol inside an li", "Yes, but only in ordered lists", "No, it breaks the page"], correct: "Yes, by putting a ul/ol inside an li" }, { q: "What does 'ul' stand for?", options: ["Underlined List", "Unordered List", "Unified List", "Universal List"], correct: "Unordered List" }];
const L10_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n    <title>Forms</title>\n</head>\n<body>\n    <!-- Build a simple form with a label, input, and button -->\n\n</body>\n</html>`;
const L10_QUIZ = [{ q: "Which element wraps all the input fields of a form?", options: ["<input>", "<fieldset>", "<form>", "<wrapper>"], correct: "<form>" }, { q: "Which tag is used to create text boxes, checkboxes, and radio buttons?", options: ["<input>", "<type>", "<field>", "<box>"], correct: "<input>" }, { q: "How do you specify what type of data an <input> should collect?", options: ["The kind attribute", "The type attribute", "The data attribute", "The style attribute"], correct: "The type attribute" }, { q: "What is the purpose of the <label> tag?", options: ["To make text red", "To describe an input for accessibility and usability", "To submit the form", "To hide an input"], correct: "To describe an input for accessibility and usability" }, { q: "Which type attribute creates a button to send the form data?", options: ["type=\"send\"", "type=\"submit\"", "type=\"button\"", "type=\"enter\""], correct: "type=\"submit\"" }];

// ---- CSS (11-22) ----
const L11_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <title>CSS Basics</title>\n  <!-- Add your <style> tag here -->\n\n</head>\n<body>\n    <h1>Make me blue!</h1>\n</body>\n</html>`;
const L11_QUIZ = [{ q: "What does CSS stand for?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Colorful Style Sheets"], correct: "Cascading Style Sheets" }, { q: "Which HTML tag is used to define internal CSS?", options: ["<script>", "<css>", "<style>", "<design>"], correct: "<style>" }, { q: "Where in an HTML document is the correct place to refer to an internal style sheet?", options: ["In the <body> section", "At the end of the document", "In the <head> section", "Inside the <html> tag directly"], correct: "In the <head> section" }, { q: "Which CSS property is used to change the text color of an element?", options: ["fgcolor", "text-color", "color", "font-color"], correct: "color" }];
const L12_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <title>Classes and IDs</title>\n  <style>\n    /* Write your CSS selectors here */\n\n  </style>\n</head>\n<body>\n    <h1 id="main-title">Rightway Skill Builder</h1>\n    <p class="highlight">This is a highlighted paragraph.</p>\n</body>\n</html>`;
const L12_QUIZ = [{ q: "How do you select an element with id 'demo'?", options: ["#demo", ".demo", "demo", "*demo"], correct: "#demo" }, { q: "How do you select elements with class name 'test'?", options: ["#test", ".test", "test", "*test"], correct: ".test" }, { q: "Can multiple elements on the same page share the same ID?", options: ["Yes", "No", "Only if they are divs", "Yes, but it's bad practice"], correct: "No" }, { q: "Which selector has higher specificity (priority)?", options: ["Class selector", "Tag selector", "ID selector", "Universal selector"], correct: "ID selector" }];
const L13_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <title>Box Model</title>\n  <style>\n    div {\n      background-color: lightgray;\n      /* Add border, padding, and margin here */\n\n    }\n  </style>\n</head>\n<body>\n    <div>I am a box!</div>\n</body>\n</html>`;
const L13_QUIZ = [{ q: "Which property is used to create space INSIDE the border of an element?", options: ["margin", "spacing", "padding", "border-spacing"], correct: "padding" }, { q: "Which property is used to create space OUTSIDE the border of an element?", options: ["margin", "padding", "spacing", "outer-space"], correct: "margin" }, { q: "Which of the following makes up the CSS Box Model?", options: ["Margins, Borders, Padding, Content", "Header, Footer, Main, Sidebar", "Text, Images, Links", "Color, Font, Background"], correct: "Margins, Borders, Padding, Content" }, { q: "How do you add a solid border?", options: ["border: solid;", "border-style: solid;", "border-type: solid;", "border-line: solid;"], correct: "border-style: solid;" }];
const L14_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    p {\n      /* Add typography styles here */\n\n    }\n  </style>\n</head>\n<body>\n    <p>Style my text to look better!</p>\n</body>\n</html>`;
const L14_QUIZ = [{ q: "Which property changes the font size?", options: ["text-size", "font-style", "font-size", "text-format"], correct: "font-size" }, { q: "Which property changes the font family?", options: ["font-family", "font-type", "font-style", "text-font"], correct: "font-family" }, { q: "How do you make text bold?", options: ["font-weight: bold;", "text-style: bold;", "font: bold;", "text-weight: heavy;"], correct: "font-weight: bold;" }, { q: "Which property centers text horizontally?", options: ["align: center;", "text-align: center;", "horizontal-align: center;", "center-text: true;"], correct: "text-align: center;" }];
const L15_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    div {\n      /* Add colors here */\n\n    }\n  </style>\n</head>\n<body>\n    <div>Color me beautifully!</div>\n</body>\n</html>`;
const L15_QUIZ = [{ q: "What is the correct hex code for black?", options: ["#FFFFFF", "#000000", "#FF0000", "#111111"], correct: "#000000" }, { q: "Which property changes the background color?", options: ["bg-color", "color-background", "background-color", "background"], correct: "background-color" }, { q: "What does RGB stand for?", options: ["Red Green Blue", "Random Great Background", "Real Good Base", "Relative Gradient Background"], correct: "Red Green Blue" }, { q: "How do you apply an image as a background?", options: ["background-image: url('...');", "bg-src: '...';", "background-src: url('...');", "image: '...';"], correct: "background-image: url('...');" }];
const L16_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    .container {\n      /* Turn this into a flex container */\n\n    }\n    .box { width: 50px; height: 50px; background: red; }\n  </style>\n</head>\n<body>\n    <div class="container">\n      <div class="box"></div>\n      <div class="box"></div>\n    </div>\n</body>\n</html>`;
const L16_QUIZ = [{ q: "How do you enable flexbox on a container?", options: ["display: flexbox;", "flex: true;", "display: flex;", "align: flex;"], correct: "display: flex;" }, { q: "Which property aligns items along the main horizontal axis in Flexbox?", options: ["align-items", "justify-content", "flex-direction", "align-content"], correct: "justify-content" }, { q: "What is the default flex-direction?", options: ["column", "row", "stack", "inline"], correct: "row" }, { q: "What value of justify-content pushes items to the far left and right edges?", options: ["center", "space-around", "space-between", "flex-end"], correct: "space-between" }];
const L17_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    .container {\n      display: flex;\n      height: 200px;\n      background: #eee;\n      /* Align items vertically and change direction */\n\n    }\n    .box { width: 50px; height: 50px; background: blue; }\n  </style>\n</head>\n<body>\n    <div class="container">\n      <div class="box"></div>\n      <div class="box"></div>\n    </div>\n</body>\n</html>`;
const L17_QUIZ = [{ q: "Which property aligns flex items vertically (on the cross axis)?", options: ["justify-content", "align-items", "vertical-align", "flex-align"], correct: "align-items" }, { q: "How do you stack flex items vertically instead of horizontally?", options: ["flex-direction: column;", "display: column;", "stack: true;", "flex-wrap: wrap;"], correct: "flex-direction: column;" }, { q: "What does 'align-items: center' do?", options: ["Centers items horizontally", "Centers items vertically in the container", "Makes the text centered", "Removes padding"], correct: "Centers items vertically in the container" }];
const L18_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    .grid {\n      /* Create a 3-column grid */\n\n      gap: 10px;\n    }\n    .item { background: green; padding: 20px; color: white; }\n  </style>\n</head>\n<body>\n    <div class="grid">\n      <div class="item">1</div><div class="item">2</div><div class="item">3</div>\n    </div>\n</body>\n</html>`;
const L18_QUIZ = [{ q: "How do you enable CSS Grid?", options: ["display: grid;", "grid: true;", "display: gridbox;", "float: grid;"], correct: "display: grid;" }, { q: "Which property defines the number and width of columns?", options: ["grid-columns", "grid-template-columns", "columns-width", "grid-layout"], correct: "grid-template-columns" }, { q: "What does the 'fr' unit stand for in Grid?", options: ["Fraction", "Frame", "Free", "Fixed Ratio"], correct: "Fraction" }, { q: "What property adds space between grid items?", options: ["margin", "padding", "gap", "spacing"], correct: "gap" }];
const L19_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    .parent { \n      height: 200px; background: #ddd; \n      /* Make this relative */\n\n    }\n    .child { \n      width: 50px; height: 50px; background: orange;\n      /* Make this absolute and position it */\n\n    }\n  </style>\n</head>\n<body>\n    <div class="parent">\n      <div class="child"></div>\n    </div>\n</body>\n</html>`;
const L19_QUIZ = [{ q: "What is the default position value for all HTML elements?", options: ["relative", "absolute", "static", "fixed"], correct: "static" }, { q: "Which position value removes an element from the normal document flow?", options: ["static", "relative", "absolute", "sticky"], correct: "absolute" }, { q: "To absolutely position a child element relative to its parent, what must the parent's position be?", options: ["static", "absolute", "relative", "fixed"], correct: "relative" }, { q: "Which position keeps an element in the exact same spot on the screen even when scrolling?", options: ["sticky", "absolute", "fixed", "relative"], correct: "fixed" }];
const L20_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    .box {\n      background: purple; padding: 20px; color: white;\n      /* Hide this box completely */\n\n    }\n  </style>\n</head>\n<body>\n    <p>Watch the box disappear!</p>\n    <div class="box">You can't see me!</div>\n</body>\n</html>`;
const L20_QUIZ = [{ q: "Which display value makes an element take up the full width available?", options: ["inline", "block", "inline-block", "none"], correct: "block" }, { q: "Which display value allows you to set width and height, but stays in line with text?", options: ["inline", "block", "inline-block", "flex"], correct: "inline-block" }, { q: "How do you completely remove an element from the page layout?", options: ["visibility: hidden;", "opacity: 0;", "display: none;", "hide: true;"], correct: "display: none;" }, { q: "What is the default display property of a <span> tag?", options: ["block", "inline", "flex", "grid"], correct: "inline" }];
const L21_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { background-color: lightblue; }\n    /* Add a media query to make background pink on small screens */\n\n  </style>\n</head>\n<body>\n    <h1>Resize the preview window!</h1>\n</body>\n</html>`;
const L21_QUIZ = [{ q: "What rule is used to apply CSS only under certain conditions, like screen width?", options: ["@screen", "@media", "@responsive", "@device"], correct: "@media" }, { q: "Which query targets screens that are 600px wide or smaller?", options: ["@media (min-width: 600px)", "@media (max-width: 600px)", "@media (width < 600px)", "@media (mobile: true)"], correct: "@media (max-width: 600px)" }, { q: "What is the concept of designing for phones first called?", options: ["Desktop First", "Mobile First", "Responsive First", "Adaptive Design"], correct: "Mobile First" }];
const L22_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    button {\n      background-color: #eee; padding: 10px 20px; border: none; cursor: pointer;\n      /* Add a transition here */\n\n    }\n    /* Add a hover effect here */\n\n  </style>\n</head>\n<body>\n    <button>Hover Me!</button>\n</body>\n</html>`;
const L22_QUIZ = [{ q: "Which pseudo-class is triggered when a user points their mouse at an element?", options: [":active", ":focus", ":hover", ":visited"], correct: ":hover" }, { q: "Which property allows property changes to occur smoothly over a specified duration?", options: ["transform", "animation", "transition", "delay"], correct: "transition" }, { q: "What does 'transition: all 0.3s ease;' do?", options: ["Moves the element 0.3s to the right", "Changes all properties smoothly over 0.3 seconds", "Delays the hover effect by 3 seconds", "Makes the element bounce"], correct: "Changes all properties smoothly over 0.3 seconds" }, { q: "Can you transition every CSS property?", options: ["Yes, all of them", "No, only properties with numerical values (like color, size)", "Only colors", "Only margins"], correct: "No, only properties with numerical values (like color, size)" }];

// ---- JAVASCRIPT (23-28) ----
const L23_STARTER = `<!DOCTYPE html>\n<html>\n<head>\n  <title>JS Basics</title>\n</head>\n<body>\n  <h1>Check the console!</h1>\n  <!-- Add a script tag below -->\n\n</body>\n</html>`;
const L23_QUIZ = [{ q: "Which HTML tag is used to embed JavaScript code?", options: ["<js>", "<script>", "<javascript>", "<code_js>"], correct: "<script>" }, { q: "Which function prints messages or values to the browser console?", options: ["print()", "write()", "console.log()", "display()"], correct: "console.log()" }, { q: "Where can JavaScript be placed in an HTML document?", options: ["Only in <head>", "Only in <body>", "In both <head> and <body>", "Outside <html>"], correct: "In both <head> and <body>" }];
const L24_STARTER = `<!DOCTYPE html>\n<html>\n<body>\n  <script>\n    // Declare variables here\n\n  </script>\n</body>\n</html>`;
const L24_QUIZ = [{ q: "Which keyword is recommended for declaring variables that CAN change?", options: ["var", "let", "const", "set"], correct: "let" }, { q: "Which keyword is used for declaring constant variables that CANNOT change?", options: ["var", "let", "const", "static"], correct: "const" }, { q: "What happens if you try to reassign a const variable?", options: ["It works fine", "It throws a TypeError", "It converts to let", "It turns into a string"], correct: "It throws a TypeError" }];
const L25_STARTER = `<!DOCTYPE html>\n<html>\n<body>\n  <script>\n    // Write a function here\n\n  </script>\n</body>\n</html>`;
const L25_QUIZ = [{ q: "How do you define a function in JavaScript?", options: ["def myFunction()", "function myFunction()", "func myFunction()", "create myFunction()"], correct: "function myFunction()" }, { q: "Which keyword is used to send back a value from a function?", options: ["send", "output", "return", "give"], correct: "return" }, { q: "How do you call/execute a function named 'greet'?", options: ["call greet", "greet()", "greet.run()", "run greet"], correct: "greet()" }];
const L26_STARTER = `<!DOCTYPE html>\n<html>\n<body>\n  <script>\n    let score = 85;\n    // Write an if/else statement here\n\n  </script>\n</body>\n</html>`;
const L26_QUIZ = [{ q: "Which keyword starts a conditional statement?", options: ["if", "when", "check", "condition"], correct: "if" }, { q: "Which block executes if the 'if' condition is false?", options: ["then", "else", "otherwise", "catch"], correct: "else" }, { q: "Which comparison operator checks if two values are equal AND of the same type?", options: ["==", "=", "===", "equals"], correct: "===" }];
const L27_STARTER = `<!DOCTYPE html>\n<html>\n<body>\n  <h1 id="heading">Original Title</h1>\n  <script>\n    // Change the text of the heading using JS\n\n  </script>\n</body>\n</html>`;
const L27_QUIZ = [{ q: "Which DOM method selects an element by its ID?", options: ["document.queryId()", "document.getElementById()", "document.getElement()", "document.findId()"], correct: "document.getElementById()" }, { q: "Which property updates the plain text inside an element?", options: ["textContent", "innerTextOnly", "value", "htmlText"], correct: "textContent" }, { q: "What does DOM stand for?", options: ["Document Object Model", "Data Object Manager", "Digital Output Mode", "Desktop Orient System"], correct: "Document Object Model" }];
const L28_STARTER = `<!DOCTYPE html>\n<html>\n<body>\n  <button id="btn">Click Me</button>\n  <h1 id="title">Hello</h1>\n  <script>\n    // Add an event listener to the button\n\n  </script>\n</body>\n</html>`;
const L28_QUIZ = [{ q: "Which method attaches an event handler to an element without overwriting existing ones?", options: ["attachEvent()", "addEventListener()", "on()", "listen()"], correct: "addEventListener()" }, { q: "Which event fires when a user clicks on an element?", options: ["hover", "press", "click", "mouseclick"], correct: "click" }];

// ---- MEDICAL CODING (29-33) ----
const L29_STARTER = `<!-- Patient Medical Chart -->\n<div class="patient-chart">\n  <h3>Patient Encounter: Outpatient Clinic</h3>\n  <p>Chief Complaint: Acute sore throat and fever.</p>\n  <p>Assessment: Acute pharyngitis.</p>\n  <!-- Assign Diagnosis Code J02.9 below -->\n  <div id="icd-code">J02.9</div>\n</div>`;
const L29_QUIZ = [
  { q: "What is the primary role of a medical coder?", options: ["Administer medications to patients", "Translate medical charts and diagnoses into standardized codes", "Schedule doctor appointments", "Perform surgical operations"], correct: "Translate medical charts and diagnoses into standardized codes" },
  { q: "Which standardized classification system is used for diagnosis coding?", options: ["ICD-10-CM", "CPT", "HCPCS Level II", "DRG"], correct: "ICD-10-CM" },
  { q: "What does EHR stand for in healthcare?", options: ["Electronic Health Record", "Emergency Hospital Room", "Essential Health Ratio", "Estimated Healthcare Revenue"], correct: "Electronic Health Record" }
];

const L30_STARTER = `<!-- ICD-10-CM Diagnosis Entry -->\n<div class="diagnosis-entry">\n  <h4>Condition: Type 2 Diabetes Mellitus</h4>\n  <p>Manifestation: Without complications</p>\n  <!-- Enter the ICD-10 code E11.9 in the code-box below -->\n  <div class="code-box">E11.9</div>\n</div>`;
const L30_QUIZ = [
  { q: "What is the first character in every ICD-10-CM code?", options: ["A number from 0-9", "An alphabetical letter (A-Z except U)", "A symbol like # or @", "A Roman numeral"], correct: "An alphabetical letter (A-Z except U)" },
  { q: "Where does the decimal point appear in an ICD-10-CM code?", options: ["After the first character", "After the second character", "After the third character", "At the very end"], correct: "After the third character" },
  { q: "What is the maximum length of an ICD-10-CM code including extensions?", options: ["4 characters", "5 characters", "7 characters", "10 characters"], correct: "7 characters" }
];

const L31_STARTER = `<!-- CPT Procedure Assignment -->\n<div class="procedure-entry">\n  <h4>Service: Established Patient Outpatient Visit</h4>\n  <p>Medical Decision Making: Low complexity (Level 3)</p>\n  <!-- Enter the 5-digit CPT code 99213 in the code-box below -->\n  <div class="code-box">99213</div>\n</div>`;
const L31_QUIZ = [
  { q: "How many digits are in a standard Category I CPT code?", options: ["3 digits", "5 digits", "7 digits", "9 digits"], correct: "5 digits" },
  { q: "Which organization maintains and copyrights CPT codes?", options: ["World Health Organization (WHO)", "American Medical Association (AMA)", "Centers for Medicare & Medicaid Services (CMS)", "FDA"], correct: "American Medical Association (AMA)" },
  { q: "Which CPT section covers general office visits and consultations?", options: ["Surgery", "Evaluation and Management (E/M)", "Radiology", "Pathology"], correct: "Evaluation and Management (E/M)" }
];

const L32_STARTER = `<!-- HCPCS Level II Entry -->\n<div class="hcpcs-entry">\n  <h4>Item: Standard Manual Wheelchair</h4>\n  <!-- Add HCPCS code K0001 and Right-side modifier RT below -->\n  <div class="hcpcs-code">K0001</div>\n  <div class="modifier">RT</div>\n</div>`;
const L32_QUIZ = [
  { q: "What does HCPCS Level II primarily code for?", options: ["Office visits only", "Durable medical equipment, prosthetics, ambulance, and drugs", "Laboratory tests only", "Dental cleanings only"], correct: "Durable medical equipment, prosthetics, ambulance, and drugs" },
  { q: "How is a standard HCPCS Level II code structured?", options: ["One letter followed by four numbers", "Five letters", "Six numbers", "Three digits followed by a decimal"], correct: "One letter followed by four numbers" },
  { q: "What is the purpose of a modifier in medical coding?", options: ["To delete a code", "To provide extra necessary clinical context without changing the code's definition", "To increase the patient bill", "To change the doctor's name"], correct: "To provide extra necessary clinical context without changing the code's definition" }
];

const L33_STARTER = `<!-- Medical Billing Claim -->\n<form class="claim-form">\n  <h3>Outpatient CMS-1500 Claim</h3>\n  <div class="field">NPI: 1234567890</div>\n  <div class="field">Payer: Medicare Part B</div>\n  <!-- Ensure status is set to CLEAN_CLAIM -->\n  <div class="status">CLEAN_CLAIM</div>\n</form>`;
const L33_QUIZ = [
  { q: "Which standard paper form is used for professional outpatient billing?", options: ["CMS-1500", "UB-04", "W-2", "Form 1040"], correct: "CMS-1500" },
  { q: "What is a 'Clean Claim' in medical billing?", options: ["A claim with no errors that can be processed and paid without delay", "A sanitized paper document", "A claim that is free of charge", "A claim filed only by hospitals"], correct: "A claim with no errors that can be processed and paid without delay" },
  { q: "What does HIPAA protect in healthcare?", options: ["Hospital construction budgets", "Patient health information privacy and security", "Physician salaries", "Medical school accreditation"], correct: "Patient health information privacy and security" }
];

/* ============================================================
   FULL LESSON LIST — id, title, concept cards, practice task, quiz
   ============================================================ */
export const BASE_LESSONS = [
  { id: 1, title: "HTML Basics", desc: "Learn five essential HTML tags and understand how they are used to structure content.", tagsToLearn: "5 Tags to Learn",
    cards: [
      { tag: "<h1>", title: "Heading", explanation: "Defines the main heading of a web page.", exampleCode: "<h1>Welcome</h1>", preview: "<h1 style='font-size:22px;font-weight:700;margin:0'>Welcome</h1>" },
      { tag: "<p>", title: "Paragraph", explanation: "Defines a block of text.", exampleCode: "<p>HTML structure.</p>", preview: "<p style='margin:0'>HTML structure.</p>" },
      { tag: "<a>", title: "Link", explanation: "Creates a hyperlink to navigate to another page.", exampleCode: `<a href="#">Link</a>`, preview: "<a href='#' style='color:#2563eb'>Link</a>" },
      { tag: "<img>", title: "Image", explanation: "Displays an image using src and alt attributes.", exampleCode: `<img src="a.jpg" alt="pic">`, preview: null },
      { tag: "<br>", title: "Line Break", explanation: "Creates a line break inside text.", exampleCode: "<br>", preview: null },
    ],
    practice: { desc: "Create a simple page using the five tags you learned in this lesson.", reqs: ["Add one main heading using the <h1> tag.", "Add one paragraph using the <p> tag.", "Add one hyperlink using the <a> tag with an href attribute.", "Add one image using the <img> tag with src and alt attributes.", "Add a line break using the <br> tag."], starterCode: L1_STARTER, validateFn: "validateTask" },
    quiz: { questions: L1_QUIZ } },

  { id: 2, title: "Document Structure", desc: "Every HTML page follows the same basic skeleton.", tagsToLearn: "5 Tags to Learn",
    cards: [
      { tag: "<!DOCTYPE html>", title: "Doctype", explanation: "Declares modern HTML5 rules to the browser.", exampleCode: "<!DOCTYPE html>", preview: null },
      { tag: "<html>", title: "Html Root", explanation: "Wraps all content on the entire page.", exampleCode: "<html></html>", preview: null },
      { tag: "<head>", title: "Head Section", explanation: "Contains page title and meta information.", exampleCode: "<head></head>", preview: null },
      { tag: "<title>", title: "Title Tag", explanation: "Sets the browser tab title.", exampleCode: "<title>Hi</title>", preview: null },
      { tag: "<body>", title: "Body Section", explanation: "Holds all visible content on the webpage.", exampleCode: "<body></body>", preview: null },
    ],
    practice: { desc: "Fill in the starter file below so it has a complete, correctly structured HTML document.", reqs: ["Start the page with a <!DOCTYPE html> declaration.", "Wrap the page in an <html> tag.", "Add a <head> section.", "Add a <title> tag inside <head> with some text in it.", "Add a <body> section."], starterCode: L2_STARTER, validateFn: "validateStructureTask" },
    quiz: { questions: L2_QUIZ } },

  { id: 3, title: "HTML Elements", desc: "Elements hold, group, and style content.", tagsToLearn: "5 Tags to Learn",
    cards: [
      { tag: "<div>", title: "Division", explanation: "Generic block-level container.", exampleCode: "<div>A</div>", preview: null },
      { tag: "<span>", title: "Span", explanation: "Generic inline container for styling text inline.", exampleCode: "<span>B</span>", preview: null },
      { tag: "<strong>", title: "Strong", explanation: "Renders text as important and bold.", exampleCode: "<strong>C</strong>", preview: "<strong>C</strong>" },
      { tag: "<em>", title: "Emphasis", explanation: "Renders text with italic emphasis.", exampleCode: "<em>D</em>", preview: "<em>D</em>" },
      { tag: "nesting", title: "Nesting Elements", explanation: "Placing HTML elements inside other elements.", exampleCode: "<div><p></p></div>", preview: null },
    ],
    practice: { desc: "Fill in the starter file below using the elements you just learned.", reqs: ["Add a <div> container element.", "Add a <span> element for inline text.", "Use <strong> to mark important text.", "Use <em> to mark emphasized text.", "Nest at least one other element inside your <div>."], starterCode: L3_STARTER, validateFn: "validateElementsTask" },
    quiz: { questions: L3_QUIZ } },

  { id: 4, title: "HTML Attributes", desc: "Attributes give elements extra information and behavior.", tagsToLearn: "Attributes",
    cards: [
      { tag: "href", title: "Href Attribute", explanation: "Specifies the destination URL of a link.", exampleCode: `<a href="#">Go</a>`, preview: null },
      { tag: "src / alt", title: "Src & Alt", explanation: "Specify an image's file path and fallback text.", exampleCode: `<img src="a.jpg" alt="A">`, preview: null },
      { tag: "id / class", title: "Id & Class", explanation: "Uniquely identify or group elements for styling.", exampleCode: `<div id="a" class="b"></div>`, preview: null },
    ],
    practice: { desc: "Add the correct attributes to each element below.", reqs: ["Add an href attribute to the <a> tag.", "Add a src attribute to the <img> tag.", "Add an alt attribute to the <img> tag.", "Add an id attribute to any element.", "Add a class attribute to any element."], starterCode: L4_STARTER, validateFn: "validateAttributesTask" },
    quiz: { questions: L4_QUIZ } },

  { id: 5, title: "HTML Headings", desc: "Structure text importance.", tagsToLearn: "Headings H1-H6",
    cards: [
      { tag: "<h1>", title: "Heading 1", explanation: "Most important heading level.", exampleCode: "<h1>Text</h1>", preview: "<h1 style='font-size:20px;font-weight:700;margin:0'>Text</h1>" },
      { tag: "<h2>", title: "Heading 2", explanation: "Subheading level.", exampleCode: "<h2>Text</h2>", preview: "<h2 style='font-size:17px;font-weight:700;margin:0'>Text</h2>" },
      { tag: "<h3>", title: "Heading 3", explanation: "Third-level heading.", exampleCode: "<h3>Text</h3>", preview: "<h3 style='font-size:15px;font-weight:700;margin:0'>Text</h3>" },
    ],
    practice: { desc: "Add properly structured headings to the document below to organize the content.", reqs: ["Include one <h1> element.", "Include at least one <h2> element.", "Include at least one <h3> element."], starterCode: L5_STARTER, validateFn: "validateHeadingsTask" },
    quiz: { questions: L5_QUIZ } },

  { id: 6, title: "HTML Paragraphs", desc: "Formatting text blocks.", tagsToLearn: "Text blocks",
    cards: [
      { tag: "<p>", title: "Paragraph", explanation: "Defines standard paragraphs of text.", exampleCode: "<p>Hi</p>", preview: "<p style='margin:0'>Hi</p>" },
      { tag: "<hr>", title: "Horizontal Rule", explanation: "Creates a thematic horizontal line break.", exampleCode: "<hr>", preview: "<hr style='margin:0'>" },
      { tag: "<pre>", title: "Preformatted Text", explanation: "Preserves exact whitespace and line breaks.", exampleCode: "<pre>  Space  </pre>", preview: null },
    ],
    practice: { desc: "Use the paragraph, thematic break, and preformatted text tags to structure the document below.", reqs: ["Include a <p> element.", "Include an <hr> tag to separate content.", "Include a <pre> element for preformatted text."], starterCode: L6_STARTER, validateFn: "validateParagraphsTask" },
    quiz: { questions: L6_QUIZ } },

  { id: 7, title: "HTML Links", desc: "Connecting web pages.", tagsToLearn: "Links",
    cards: [
      { tag: "<a>", title: "Anchor", explanation: "Defines a clickable hyperlink.", exampleCode: `<a href="#">Go</a>`, preview: null },
      { tag: "target", title: "Target Attribute", explanation: "Specifies target tab (_blank opens in a new tab).", exampleCode: `<a target="_blank">New Tab</a>`, preview: null },
    ],
    practice: { desc: "Create working hyperlinks to navigate between different resources.", reqs: ["Include at least two <a> elements.", "Use the target=\"_blank\" attribute on at least one link."], starterCode: L7_STARTER, validateFn: "validateLinksTask" },
    quiz: { questions: L7_QUIZ } },

  { id: 8, title: "HTML Images", desc: "Embedding media.", tagsToLearn: "Images",
    cards: [
      { tag: "<img>", title: "Image Tag", explanation: "Embeds an image element into the webpage.", exampleCode: `<img>`, preview: null },
      { tag: "width", title: "Width Attribute", explanation: "Sets the width dimension of an image.", exampleCode: `<img width="100">`, preview: null },
    ],
    practice: { desc: "Embed visual media into the page and configure its size and accessibility.", reqs: ["Include an <img> element.", "Ensure the image has an alt attribute.", "Ensure the image has a width attribute."], starterCode: L8_STARTER, validateFn: "validateImagesTask" },
    quiz: { questions: L8_QUIZ } },

  { id: 9, title: "HTML Lists", desc: "Bullet and numbered points.", tagsToLearn: "Lists",
    cards: [
      { tag: "<ul>", title: "Unordered List", explanation: "Renders bulleted list items.", exampleCode: "<ul><li>1</li></ul>", preview: null },
      { tag: "<ol>", title: "Ordered List", explanation: "Renders numbered list items.", exampleCode: "<ol><li>1</li></ol>", preview: null },
      { tag: "<li>", title: "List Item", explanation: "Individual item inside a list.", exampleCode: "<li>Item</li>", preview: null },
    ],
    practice: { desc: "Create properly formatted lists to organize multiple items clearly.", reqs: ["Include an Unordered List (<ul>).", "Include an Ordered List (<ol>).", "Include at least 4 List Items (<li>) across your lists."], starterCode: L9_STARTER, validateFn: "validateListsTask" },
    quiz: { questions: L9_QUIZ } },

  { id: 10, title: "HTML Forms", desc: "Collecting user input.", tagsToLearn: "Forms",
    cards: [
      { tag: "<form>", title: "Form Wrapper", explanation: "Container that wraps all input controls.", exampleCode: "<form></form>", preview: null },
      { tag: "<input>", title: "Input Field", explanation: "Interactive control field for collecting data.", exampleCode: "<input>", preview: null },
      { tag: "<label>", title: "Label Element", explanation: "Captions an input control for accessibility.", exampleCode: "<label>Name</label>", preview: null },
      { tag: "<button>", title: "Button", explanation: "Triggers form submission.", exampleCode: "<button>Send</button>", preview: null },
    ],
    practice: { desc: "Build a basic form layout with inputs, labels, and a submit button.", reqs: ["Include a <form> element.", "Include an <input> element.", "Include a <label> element.", "Include a <button> element to submit the form."], starterCode: L10_STARTER, validateFn: "validateFormsTask" },
    quiz: { questions: L10_QUIZ } },

  // CSS (11-22)
  { id: 11, title: "CSS Basics", desc: "Learn how to use internal stylesheets to change the colors of your HTML elements.", tagsToLearn: "Syntax & Colors",
    cards: [
      { tag: "<style>", title: "Style Tag", explanation: "Defines internal CSS inside the <head>.", exampleCode: "<head>\n  <style>\n  </style>\n</head>", preview: null },
      { tag: "color", title: "Text Color", explanation: "Changes the color of the text.", exampleCode: "p {\n  color: red;\n}", preview: "<p style='color:red;margin:0'>Red Text</p>" },
    ],
    practice: { desc: "Write some internal CSS to make the heading blue.", reqs: ["Include a <style> tag in the <head>.", "Target the h1 element.", "Set the color to blue."], starterCode: L11_STARTER, validateFn: "validateCssBasicsTask" },
    quiz: { questions: L11_QUIZ } },

  { id: 12, title: "Classes & IDs", desc: "Target specific elements using ID and Class selectors.", tagsToLearn: "Selectors",
    cards: [
      { tag: ".class", title: "Class Selector", explanation: "Targets elements with a specific class using a period (.).", exampleCode: ".highlight {\n  color: yellow;\n}", preview: "<span style='color:#a16207;background:#fef9c3;padding:2px 4px;border-radius:4px'>Yellow Text</span>" },
      { tag: "#id", title: "ID Selector", explanation: "Targets a unique element with a specific ID using a hash (#).", exampleCode: "#main-title {\n  font-size: 40px;\n}", preview: "<span style='font-size:20px;font-weight:700'>Big Text</span>" },
    ],
    practice: { desc: "Style the elements using their class and ID names.", reqs: ["Target the .highlight class and make it yellow.", "Target the #main-title ID and make it 40px font-size."], starterCode: L12_STARTER, validateFn: "validateCssSelectorsTask" },
    quiz: { questions: L12_QUIZ } },

  { id: 13, title: "The Box Model", desc: "Learn about margins, padding, and borders to create space around your elements.", tagsToLearn: "Box Model",
    cards: [
      { tag: "border", title: "Border", explanation: "A line wrapped around the element.", exampleCode: "div {\n  border: 2px solid black;\n}", preview: "<div style='border:2px solid black;padding:4px;display:inline-block'>Bordered Box</div>" },
      { tag: "padding", title: "Padding", explanation: "Space INSIDE the border.", exampleCode: "div {\n  padding: 20px;\n}", preview: null },
      { tag: "margin", title: "Margin", explanation: "Space OUTSIDE the border.", exampleCode: "div {\n  margin: 30px;\n}", preview: null },
    ],
    practice: { desc: "Add a border, padding, and margin to the div.", reqs: ["Add a solid black border to the div.", "Add 20px padding to the div.", "Add 30px margin to the div."], starterCode: L13_STARTER, validateFn: "validateCssBoxModelTask" },
    quiz: { questions: L13_QUIZ } },

  { id: 14, title: "Typography", desc: "Learn to change font sizes, families, and text alignments.", tagsToLearn: "Typography",
    cards: [
      { tag: "font-family", title: "Font Family", explanation: "Changes the typeface.", exampleCode: "p { font-family: Arial, sans-serif; }", preview: "<p style='font-family:Arial;margin:0'>Arial Text</p>" },
      { tag: "font-size", title: "Font Size", explanation: "Changes how large the text is.", exampleCode: "p { font-size: 24px; }", preview: "<p style='font-size:24px;margin:0'>Big Text</p>" },
    ],
    practice: { desc: "Style the typography of the paragraph.", reqs: ["Set font-family to Arial.", "Set font-size to 24px.", "Center the text with text-align."], starterCode: L14_STARTER, validateFn: "validateCssTypographyTask" },
    quiz: { questions: L14_QUIZ } },

  { id: 15, title: "Colors & Backgrounds", desc: "Use hex codes and rgb to style colors and backgrounds.", tagsToLearn: "Colors",
    cards: [
      { tag: "HEX", title: "Hex Codes", explanation: "6-character color codes.", exampleCode: "div { background-color: #000000; }", preview: "<div style='background:#000;color:#fff;padding:4px;display:inline-block'>Black Box</div>" },
      { tag: "RGB", title: "RGB", explanation: "Red, Green, Blue color values.", exampleCode: "p { color: rgb(255, 0, 0); }", preview: "<p style='color:red;margin:0'>Red Text</p>" },
    ],
    practice: { desc: "Apply distinct colors to the text and background.", reqs: ["Set background-color using a hex code.", "Set text color using rgb()."], starterCode: L15_STARTER, validateFn: "validateCssColorsTask" },
    quiz: { questions: L15_QUIZ } },

  { id: 16, title: "Flexbox Basics", desc: "Use flexbox to align items in one dimension.", tagsToLearn: "Flexbox",
    cards: [
      { tag: "display: flex", title: "Flex Container", explanation: "Turns an element into a flex container.", exampleCode: ".container { display: flex; }", preview: null },
      { tag: "justify-content", title: "Horizontal Alignment", explanation: "Aligns items along the main axis.", exampleCode: ".container { justify-content: center; }", preview: null },
    ],
    practice: { desc: "Make the container a flexbox and space out the boxes.", reqs: ["Use display: flex on the container.", "Use justify-content: space-between."], starterCode: L16_STARTER, validateFn: "validateCssFlexTask" },
    quiz: { questions: L16_QUIZ } },

  { id: 17, title: "Flexbox Alignment", desc: "Learn to change the flex direction and align items vertically.", tagsToLearn: "Flex Alignment",
    cards: [
      { tag: "flex-direction", title: "Direction", explanation: "Changes layout from row to column.", exampleCode: ".container { flex-direction: column; }", preview: null },
      { tag: "align-items", title: "Vertical Alignment", explanation: "Aligns items on the cross axis.", exampleCode: ".container { align-items: center; }", preview: null },
    ],
    practice: { desc: "Center the boxes and stack them vertically.", reqs: ["Use align-items: center.", "Use flex-direction: column."], starterCode: L17_STARTER, validateFn: "validateCssFlexAlignTask" },
    quiz: { questions: L17_QUIZ } },

  { id: 18, title: "CSS Grid", desc: "Create two-dimensional layouts with rows and columns.", tagsToLearn: "CSS Grid",
    cards: [
      { tag: "display: grid", title: "Grid Container", explanation: "Enables CSS grid on an element.", exampleCode: ".grid { display: grid; }", preview: null },
      { tag: "grid-template", title: "Columns", explanation: "Defines the column structure.", exampleCode: ".grid { grid-template-columns: 1fr 1fr; }", preview: null },
    ],
    practice: { desc: "Turn the container into a grid with 3 equal columns.", reqs: ["Use display: grid.", "Use grid-template-columns to make 3 columns."], starterCode: L18_STARTER, validateFn: "validateCssGridTask" },
    quiz: { questions: L18_QUIZ } },

  { id: 19, title: "Positioning", desc: "Move elements out of the normal document flow.", tagsToLearn: "Positioning",
    cards: [
      { tag: "relative", title: "Relative", explanation: "Positioned relative to its normal spot.", exampleCode: ".box { position: relative; top: 10px; }", preview: null },
      { tag: "absolute", title: "Absolute", explanation: "Positioned relative to nearest positioned ancestor.", exampleCode: ".box { position: absolute; left: 0; }", preview: null },
    ],
    practice: { desc: "Make the parent relative so the child can be absolutely positioned inside it.", reqs: ["Use position: relative on the parent.", "Use position: absolute on the child."], starterCode: L19_STARTER, validateFn: "validateCssPositionTask" },
    quiz: { questions: L19_QUIZ } },

  { id: 20, title: "Display Properties", desc: "Change how elements behave structurally.", tagsToLearn: "Display",
    cards: [
      { tag: "block", title: "Block", explanation: "Takes full width, starts on new line.", exampleCode: "span { display: block; }", preview: null },
      { tag: "none", title: "None", explanation: "Hides the element completely.", exampleCode: ".box { display: none; }", preview: null },
    ],
    practice: { desc: "Hide the purple box completely using the display property.", reqs: ["Use display: none to hide the box."], starterCode: L20_STARTER, validateFn: "validateCssDisplayTask" },
    quiz: { questions: L20_QUIZ } },

  { id: 21, title: "Responsive Design", desc: "Use Media Queries to adapt your layout to different screen sizes.", tagsToLearn: "Media Queries",
    cards: [
      { tag: "@media", title: "Media Query", explanation: "Applies CSS only under certain conditions.", exampleCode: "@media (max-width: 600px) {\n  body { background: pink; }\n}", preview: null },
    ],
    practice: { desc: "Write a media query that changes the background color when the screen is smaller than 600px.", reqs: ["Create a @media query for max-width 600px.", "Change the background color inside the media query."], starterCode: L21_STARTER, validateFn: "validateCssResponsiveTask" },
    quiz: { questions: L21_QUIZ } },

  { id: 22, title: "Transitions & Hover", desc: "Add interactivity and smooth animations to your elements.", tagsToLearn: "Transitions",
    cards: [
      { tag: ":hover", title: "Hover State", explanation: "Applies CSS when the mouse is over the element.", exampleCode: "button:hover { background: blue; }", preview: null },
      { tag: "transition", title: "Transition", explanation: "Animates property changes smoothly.", exampleCode: "button { transition: all 0.3s; }", preview: null },
    ],
    practice: { desc: "Make the button change background color smoothly when hovered.", reqs: ["Add a transition property to the button.", "Use the :hover pseudo-class to change the background color."], starterCode: L22_STARTER, validateFn: "validateCssTransitionsTask" },
    quiz: { questions: L22_QUIZ } },

  // JAVASCRIPT (23-28)
  { id: 23, title: "JavaScript Basics", desc: "Embed JavaScript logic in HTML using the script tag and log outputs.", tagsToLearn: "<script> & console.log",
    cards: [
      { tag: "<script>", title: "Script Tag", explanation: "Embeds JavaScript execution in HTML documents.", exampleCode: "<script>\n  console.log('Hello');\n</script>", preview: null },
      { tag: "console.log", title: "Console Log", explanation: "Prints outputs to the browser's developer console.", exampleCode: "console.log('Hello World!');", preview: null },
    ],
    practice: { desc: "Add a script tag and output a message using console.log().", reqs: ["Include a <script> tag.", "Call console.log()."], starterCode: L23_STARTER, validateFn: "validateJsBasicsTask" },
    quiz: { questions: L23_QUIZ } },

  { id: 24, title: "Variables (let & const)", desc: "Store and manipulate data using modern JavaScript variable declarations.", tagsToLearn: "let & const",
    cards: [
      { tag: "let", title: "Let Variable", explanation: "Declares a block-scoped variable that can be reassigned.", exampleCode: "let score = 10;\nscore = 20;", preview: null },
      { tag: "const", title: "Const Variable", explanation: "Declares a read-only constant variable that cannot be reassigned.", exampleCode: "const maxXP = 100;", preview: null },
    ],
    practice: { desc: "Declare variables using let or const and log them.", reqs: ["Declare variables using let or const.", "Log the variable to console."], starterCode: L24_STARTER, validateFn: "validateJsVarsTask" },
    quiz: { questions: L24_QUIZ } },

  { id: 25, title: "Functions", desc: "Create reusable blocks of code with parameters and return values.", tagsToLearn: "Functions",
    cards: [
      { tag: "function", title: "Function Declaration", explanation: "Defines a reusable code block.", exampleCode: "function add(a, b) {\n  return a + b;\n}", preview: null },
    ],
    practice: { desc: "Define a function that returns or logs a result.", reqs: ["Define a function.", "Return a value or log from the function."], starterCode: L25_STARTER, validateFn: "validateJsFuncsTask" },
    quiz: { questions: L25_QUIZ } },

  { id: 26, title: "Conditionals (If/Else)", desc: "Make decisions in your code based on logical conditions.", tagsToLearn: "If/Else",
    cards: [
      { tag: "if/else", title: "Conditional Execution", explanation: "Runs different code blocks depending on truthy values.", exampleCode: "if (score >= 50) {\n  console.log('Pass');\n} else {\n  console.log('Fail');\n}", preview: null },
    ],
    practice: { desc: "Write an if/else statement to check a variable.", reqs: ["Use an if statement.", "Use an else block."], starterCode: L26_STARTER, validateFn: "validateJsCondsTask" },
    quiz: { questions: L26_QUIZ } },

  { id: 27, title: "DOM Manipulation", desc: "Select HTML elements and change their content dynamically.", tagsToLearn: "DOM",
    cards: [
      { tag: "getElementById", title: "Element Selection", explanation: "Selects a single DOM element by its ID.", exampleCode: "const title = document.getElementById('heading');\ntitle.textContent = 'New Title';", preview: null },
    ],
    practice: { desc: "Select the heading element by ID and change its text content.", reqs: ["Select element with document.getElementById.", "Modify textContent or innerHTML."], starterCode: L27_STARTER, validateFn: "validateJsDomTask" },
    quiz: { questions: L27_QUIZ } },

  { id: 28, title: "Event Listeners", desc: "Respond to user actions like clicks dynamically.", tagsToLearn: "Events",
    cards: [
      { tag: "addEventListener", title: "Event Handler", explanation: "Attaches an event handler function to an element.", exampleCode: "btn.addEventListener('click', function() {\n  alert('Clicked!');\n});", preview: null },
    ],
    practice: { desc: "Attach a click event listener to the button element.", reqs: ["Add a click listener with addEventListener or onclick."], starterCode: L28_STARTER, validateFn: "validateJsEventsTask" },
    quiz: { questions: L28_QUIZ } },

];
