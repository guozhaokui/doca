// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function isTemporaryFile(editor:vscode.TextEditor) {
	if (!editor) {
	  return false;
	}
  
	const scheme = editor.document.uri.scheme;
  
	// 此处检查`scheme`是否不是`file`，这可能意味着文件是临时的
	// 通常未保存的新文件的`scheme`是`untitled`
	return scheme !== 'file';
  }

async function modifyRelatedDocaFile(filePath: string, id: number): Promise<void> {
	const docaFilePath = filePath.replace(/\.[^.]*$/, '.doca'); // 将扩展名替换为.doca
  
	// 检查.doca文件是否存在
	if(fs.existsSync(docaFilePath)){
		fs.writeFileSync(docaFilePath,`[id:${id}]`,{encoding:'utf-8'});
		return;
	}
	// 读取.doca文件的内容
	//const docaContent = fs.readFileSync(docaFilePath, 'utf8');
	// 这里开始你的修改逻辑，下面只是一个示例
	fs.appendFileSync(docaFilePath,`[id:${id}]`);
	// 将修改后的内容写回.doca文件
	//fs.writeFileSync(docaFilePath, modifiedContent, 'utf8');
  }
  

function findIdInText(text: string): number {
	let lines = text.split('\n');
	let ids = [];
	const idPattern = /<!--doca:(\d+)-->/; // 你需要替换为匹配ID的正则表达式
	for(let i=0,l=lines.length; i<l; i++){
		let line = lines[i]
		if(line.startsWith('<')){
			const match = idPattern.exec(line);
			if (match && match[1]) {
				ids.push(parseInt(match[1]))
			}
		}
	}
	//找一个没人用过的id
	let id=1
	while(true){
		if(ids.indexOf(id)<0)
			return id;
		id++;
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "doca" is now active!');

	let disposable = vscode.commands.registerCommand('extension.addSurroundingStrings', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
		  vscode.window.showInformationMessage('No editor is active');
		  return;
		}

		// 获取当前文档内容
		const text = editor.document.getText();
		// 解析出ID
		const id = findIdInText(text);		
	
		// 获取当前编辑文件的路径
		const currentFilePath = editor.document.uri.fsPath;		
		// 先修改.doca文件
		if(!isTemporaryFile(editor)){
			await modifyRelatedDocaFile(currentFilePath, id);		
		}

		const selections = editor.selections;
		await editor.edit(editBuilder => {
		  for (const selection of selections) {
			const startLine = editor.document.lineAt(selection.start.line).text;
			const endLine = editor.document.lineAt(selection.end.line).text;
			editBuilder.insert(new vscode.Position(selection.start.line,0), '<!--doca:'+id+'-->\n');
			editBuilder.insert(new vscode.Position(selection.end.line, endLine.length), '\n<!--docaend:'+id+'-->');
		  }
		});
	  });
	
	  context.subscriptions.push(disposable);	
}

// This method is called when your extension is deactivated
export function deactivate() {}
