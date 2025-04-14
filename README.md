# GS-Markdown-Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

GS-Markdown-Generator is a Google Apps Script project that converts Markdown content into Google Slides. Using this tool, you can easily generate well-structured slides from Markdown text. The project leverages a custom HTML dialog for user input and supports various Markdown elements such as headings, text formatting, code blocks, bullet lists, tables, and images.

## Features

- **Markdown Parsing**: Converts Markdown headings, text (including bold), lists, code blocks, tables, and images.
- **Custom UI Integration**: Adds a custom menu to Google Slides and opens an HTML dialog for user input.
- **Dynamic Slide Rendering**: Computes text box dimensions and positions elements based on content.
- **Loading Overlay**: Displays a loading overlay while slides are being generated.
- **Global Code**: The code (variables, functions, etc.) is written in English for global compatibility.

## Repository Structure

```plaintext
GS-Markdown-Generator/
├── README.md         # This file, providing documentation about the project
├── Code.gs           # Main Google Apps Script code that handles the Markdown conversion
└── dialog.html       # HTML file for the custom user interface dialog
```

## Installation

1. **Create a New Google Slides Presentation**  
   Open Google Slides and create a new presentation.

2. **Open the Apps Script Editor**  
   From the Google Slides menu, navigate to `Extensions > Apps Script`.

3. **Import the Project Files**  
   - Create a new script file named **Code.gs** and paste the content provided below.
   - Create a new HTML file named **dialog.html** and paste the corresponding code.

4. **Save the Project**  
   Save your Apps Script project. When you reload the Google Slides presentation, a custom menu will appear.

## Usage

1. Open your Google Slides presentation.  
2. Click on the new menu item **"🧩 Markdown Tool"** and select **"Convert Markdown to Slides"**.  
3. In the opened HTML dialog, paste your Markdown content into the text area.  
4. Click **"📤 Generate Slides"**. A loading overlay will display while the slides are being generated.  
5. Once completed, a success message will pop up and the dialog will close.

## Contributing

Contributions are welcome!  

1. Fork the repository.  
2. Create your feature branch: `git checkout -b feature/your-feature`  
3. Commit your changes: `git commit -am 'Add some feature'`  
4. Push to the branch: `git push origin feature/your-feature`  
5. Open a pull request.

Please ensure your code adheres to the project's coding style and write clear commit messages.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Special thanks to the Google Apps Script community for their extensive documentation and examples.
- Inspired by other Markdown-to-Slides converters and open-source projects.
