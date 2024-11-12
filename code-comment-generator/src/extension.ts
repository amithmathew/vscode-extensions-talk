// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


const initGemini = () => {
	const {
		FunctionDeclarationSchemaType,
		HarmBlockThreshold,
		HarmCategory,
		VertexAI
	  } = require('@google-cloud/vertexai');
	  
	  const project = 'cr-demo-320112';
	  const location = 'us-central1';
	  const textModel =  'gemini-1.5-flash-002';
	  
	  const vertexAI = new VertexAI({project: project, location: location});

	  // Step 4 - Configuration
	  //const systemPrompt = vscode.workspace.getConfiguration('code-comment-generator').get('systemPrompt');

	  const systemPrompt = `Given the selected text, return a comment describing the text, 
						in haiku format. Your response will be pasted into the code verbatim, so make
						sure to include the comment prefixes for the given language.  
						DO NOT put the comment in markdown code fences. DO NOT add any additional text like 
						'Here is the comment' or similar. Respond ONLY with the comment.
						DO NOT put the comment in markdown code fences. If you cannot reasonably guess the language,
						assume it's python unless it is obviously not.`;
	  
	  // Instantiate Gemini models
	  const generativeModel = vertexAI.getGenerativeModel({
		  model: textModel,
		  // The following parameters are optional
		  // They can also be passed to individual content generation requests
		  safetySettings: [{category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE}],
		  generationConfig: {maxOutputTokens: 256},
		  systemInstruction: {
			role: 'system',
			parts: [{"text": systemPrompt}]
		  },
	  });
	  
	return generativeModel;
};



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


	const GenerativeModel = initGemini();
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "code-comment-generator" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('code-comment-generator.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		//vscode.window.showInformationMessage('Hello World from Code Comment Generator!');

	});
	context.subscriptions.push(disposable);


	const addCommentDisposable = vscode.commands.registerCommand('code-comment-generator.addComment', async () => {
		// Status bar - Step 5
		// let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        // statusBarItem.text = "$(loading~spin) Gemini is thinking...";
		// statusBarItem.show();


		// Get my active editor.
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor!');
			return;
		}

		const selection = editor.selection;
		const selectedText = editor.document.getText(selection);

		const request = {
			contents: [
				{role: 'user', parts: [{text: selectedText}]}
			]
		};

		//vscode.window.showInformationMessage();

		const result = await GenerativeModel.generateContent(request);
		const response = result.response;
		console.log('Response: ', JSON.stringify(response));
		const comment = response.candidates[0].content.parts[0].text;
		const codeFenceFirstLine = /^`{3}\w+\n/g;
		const codeFenceLastLine = /```\n*/g;
		const cleanedUpComment = comment.replace(codeFenceFirstLine, '').replace(codeFenceLastLine, '');
		console.log('Cleaned up: ', JSON.stringify(cleanedUpComment));
		await editor.edit(editBuilder => {
			editBuilder.insert(selection.start, cleanedUpComment);
		});

		// Status bar - Step 5
		// statusBarItem.text = "$(check) Gemini is complete.";
		// setTimeout(() => statusBarItem.hide(), 5000);
	});
	context.subscriptions.push(addCommentDisposable);

}

// This method is called when your extension is deactivated
export function deactivate() {}
