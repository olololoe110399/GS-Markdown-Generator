// Constants for positioning and style configuration
const TEXT_LEFT = 40;
const TEXT_TOP = 40;
const TEXT_WIDTH = 640;
const TITLE_HEIGHT = 40;
const TITLE_FONT_SIZE = 24;
const CODEBOX_HEIGHT = 150;
const CODEBOX_BG = "#eeeeee";
const CODEBOX_FONT = "Courier New";
const CODEBOX_SIZE = 10;
const IMAGE_WIDTH = 400;
const ELEMENT_MARGIN = 10;

const TEXT_FONT_SIZE = 14;
const LINE_HEIGHT_FACTOR = 1.2;
const AVG_CHARS_PER_LINE = 80;

/**
 * This function adds a custom menu to the Slides UI when the file is opened.
 */
function onOpen() {
  SlidesApp.getUi()
    .createMenu('🧩 Markdown Tool')
    .addItem('Convert Markdown to Slides', 'openMarkdownDialog')
    .addToUi();
}

/**
 * Opens the HTML dialog to input Markdown content.
 */
function openMarkdownDialog() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile('dialog')
    .setWidth(800)
    .setHeight(600);
  SlidesApp.getUi().showModalDialog(htmlOutput, 'Markdown to Slides');
}

/**
 * Main function to convert Markdown content into Slides.
 * @param {string} markdown - The Markdown text to be converted.
 * @returns {string} A success message after conversion.
 */
function convertMarkdownToSlides(markdown) {
  const presentation = SlidesApp.getActivePresentation();
  const slidesData = parseMarkdownToSlideJson(markdown);
  renderSlidesFromJson(presentation, slidesData);
  return "✅ Converted Markdown to Slides successfully.";
}

/**
 * Parses the Markdown content into an array of slide objects.
 * Slides are delimited by a line with three or more dashes (---).
 * @param {string} markdown - The Markdown content.
 * @returns {Array<Object>} An array of slides with format { title, layout, content }.
 */
function parseMarkdownToSlideJson(markdown) {
  const sections = markdown.split(/\n-{3,}\n/);
  const slides = [];

  sections.forEach(section => {
    const lines = section.trim().split('\n');
    let isInCodeBlock = false;
    let codeBuffer = [];
    let tableBuffer = [];
    let isParsingTable = false;

    const slide = { title: '', layout: 'BLANK', content: [] };

    lines.forEach(rawLine => {
      let line = rawLine.trim();
      if (!line) return;

      // Handling code block delimited by ```
      if (line === '```') {
        isInCodeBlock = !isInCodeBlock;
        if (!isInCodeBlock) {
          slide.content.push({ type: 'code', value: codeBuffer.join('\n') });
          codeBuffer = [];
        }
        return;
      }
      if (isInCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Handling Markdown tables: | cell1 | cell2 | ...
      if (line.match(/^\|.*\|$/)) {
        tableBuffer.push(line);
        isParsingTable = true;
        return;
      }

      // Handling headers for slide title
      if (line.startsWith('# ')) {
        slide.title = line.substring(2).trim();
        return;
      }
      if (line.startsWith('## ')) {
        slide.title = line.substring(3).trim();
        return;
      }

      // Handling subheadings (level 3)
      if (line.startsWith('### ')) {
        slide.content.push({ type: 'subheading', value: line.substring(4).trim() });
        return;
      }

      // Handling lists: bullet (-) or numbered list
      if (line.match(/^\d+\. /) || line.startsWith('- ')) {
        const bulletText = line.replace(/^\d+\. /, '').replace(/^- /, '');
        slide.content.push({ type: 'bullet', value: bulletText });
        return;
      }

      // Handling images with Markdown syntax: ![alt](url)
      if (line.match(/^!\[.*\]\(.*\)$/)) {
        const match = line.match(/!\[.*\]\((.*)\)/);
        if (match) {
          slide.content.push({ type: 'image', url: match[1] });
        }
        return;
      }

      // Handling normal text with bold formatting using **text**
      const isBold = /\*\*(.*?)\*\*/.test(line);
      const plainText = line.replace(/\*\*(.*?)\*\*/g, '$1');
      slide.content.push({ type: 'text', value: plainText, bold: isBold });
    });

    // Process table if available (requires at least header and separator row)
    if (isParsingTable && tableBuffer.length >= 2) {
      const header = tableBuffer[0].split('|').slice(1, -1).map(cell => cell.trim());
      const rows = tableBuffer.slice(2).map(row =>
        row.split('|').slice(1, -1).map(cell => cell.trim())
      );
      slide.content.push({ type: 'table', header: header, rows: rows });
      tableBuffer = [];
      isParsingTable = false;
    }

    slides.push(slide);
  });

  return slides;
}

/**
 * Renders slides based on the parsed JSON data.
 * Computes Y position and adjusts text box heights based on content.
 * @param {Presentation} presentation - The active presentation.
 * @param {Array<Object>} slidesData - An array of slide data.
 */
function renderSlidesFromJson(presentation, slidesData) {
  slidesData.forEach(slideData => {
    const currentSlide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    let currentY = TEXT_TOP;
    let textShape = null;

    /**
     * Creates a text box if not already created, and returns it.
     */
    function getTextShape() {
      if (!textShape) {
        textShape = currentSlide.insertTextBox("", TEXT_LEFT, currentY, TEXT_WIDTH, 50);
      }
      return textShape;
    }

    /**
     * Estimates the height of the text box based on content length.
     * @param {string} textContent - The content of the text.
     * @returns {number} Estimated height of the text box.
     */
    function computeTextBoxHeight(textContent) {
      const paragraphs = textContent.split('\n');
      let totalLines = 0;
      paragraphs.forEach(paragraph => {
        const lines = Math.ceil(paragraph.length / AVG_CHARS_PER_LINE) || 1;
        totalLines += lines;
      });
      return totalLines * TEXT_FONT_SIZE * LINE_HEIGHT_FACTOR;
    }

    /**
     * Flushes the current text box: updates its height and moves the Y position.
     */
    function flushTextShape() {
      if (textShape) {
        const textContent = textShape.getText().asString();
        const computedHeight = computeTextBoxHeight(textContent);
        textShape.setHeight(computedHeight);
        currentY += computedHeight + ELEMENT_MARGIN;
        textShape = null;
      }
    }

    // Render slide title if exists
    if (slideData.title) {
      renderTitle(currentSlide, slideData.title, currentY);
      currentY += TITLE_HEIGHT + ELEMENT_MARGIN;
    }

    // Render each content element in the slide
    slideData.content.forEach(item => {
      // For text, bullet, or subheading, accumulate in one textbox
      if (item.type === 'text' || item.type === 'subheading' || item.type === 'bullet') {
        const shape = getTextShape();
        const textRange = shape.getText();
        switch (item.type) {
          case 'subheading': {
            const para = textRange.appendParagraph("🔹 " + item.value);
            para.getRange().getTextStyle().setBold(true);
            break;
          }
          case 'bullet': {
            textRange.appendParagraph("• " + item.value);
            break;
          }
          case 'text': {
            const para = textRange.appendParagraph(item.value);
            if (item.bold) para.getRange().getTextStyle().setBold(true);
            break;
          }
        }
      } else {
        // Flush text box for non-text content
        flushTextShape();

        switch (item.type) {
          case 'code': {
            renderCodeBlock(currentSlide, item.value, currentY);
            currentY += CODEBOX_HEIGHT + ELEMENT_MARGIN;
            break;
          }
          case 'table': {
            const tableHeight = renderTable(currentSlide, item, currentY);
            currentY += tableHeight + ELEMENT_MARGIN;
            break;
          }
          case 'image': {
            currentY = renderImage(currentSlide, item.url, currentY);
            break;
          }
          default:
            break;
        }
      }
    });

    // Flush any remaining text box if needed
    flushTextShape();
  });
}

/**
 * Renders the slide title.
 * @param {Slide} slide - The current slide.
 * @param {string} title - The title text.
 * @param {number} posY - The Y position to place the title.
 */
function renderTitle(slide, title, posY) {
  const titleBox = slide.insertTextBox(title, TEXT_LEFT, posY, TEXT_WIDTH, TITLE_HEIGHT);
  titleBox.getText().getTextStyle()
          .setFontSize(TITLE_FONT_SIZE)
          .setBold(true);
}

/**
 * Renders a code block.
 * @param {Slide} slide - The current slide.
 * @param {string} codeText - The code text content.
 * @param {number} posY - The Y position for the code block.
 */
function renderCodeBlock(slide, codeText, posY) {
  const codeBox = slide.insertTextBox(codeText, TEXT_LEFT, posY, TEXT_WIDTH, CODEBOX_HEIGHT);
  codeBox.getText().getTextStyle()
         .setFontFamily(CODEBOX_FONT)
         .setFontSize(CODEBOX_SIZE);
  codeBox.getFill().setSolidFill(CODEBOX_BG);
}

/**
 * Renders a table.
 * @param {Slide} slide - The current slide.
 * @param {Object} tableData - The table data including header and rows.
 * @param {number} posY - The Y position for the table.
 * @returns {number} Estimated height of the table.
 */
function renderTable(slide, tableData, posY) {
  const numRows = tableData.rows.length + 1;
  const numCols = tableData.header.length;
  const table = slide.insertTable(numRows, numCols);
  table.setLeft(TEXT_LEFT).setTop(posY);

  tableData.header.forEach((headerText, colIndex) => {
    table.getCell(0, colIndex).getText().setText(headerText)
         .getTextStyle().setBold(true);
  });

  tableData.rows.forEach((row, rowIndex) => {
    row.forEach((cellText, colIndex) => {
      table.getCell(rowIndex + 1, colIndex).getText().setText(cellText);
    });
  });
  const estimatedHeight = numRows * 30;
  return estimatedHeight;
}

/**
 * Renders an image.
 * @param {Slide} slide - The current slide.
 * @param {string} imageUrl - The URL of the image.
 * @param {number} posY - The Y position for the image.
 * @returns {number} New Y position after placing the image.
 */
function renderImage(slide, imageUrl, posY) {
  try {
    const image = slide.insertImage(imageUrl);
    image.setLeft(TEXT_LEFT)
         .setTop(posY)
         .setWidth(IMAGE_WIDTH);
    const imgHeight = image.getHeight();
    return posY + imgHeight + ELEMENT_MARGIN;
  } catch (error) {
    slide.insertTextBox("⚠ Unable to insert image: " + imageUrl, TEXT_LEFT, posY, TEXT_WIDTH, 30);
    return posY + 30 + ELEMENT_MARGIN;
  }
}
