import * as path from 'path';
import {
  ArrowFunction,
  ImportDeclaration,
  JsxAttribute,
  JsxOpeningElement,
  ParameterDeclaration,
  Project,
  SyntaxKind,
} from 'ts-morph';

// Initialize project with your root tsconfig
const project = new Project({
  tsConfigFilePath: path.join(__dirname, 'tsconfig.json'),
});

// Mapping of common React events to types
const baseEventMap: Record<string, string> = {
  click: 'MouseEvent',
  change: 'ChangeEvent',
  submit: 'FormEvent',
  focus: 'FocusEvent',
  blur: 'FocusEvent',
  keydown: 'KeyboardEvent',
  keyup: 'KeyboardEvent',
  mouseenter: 'MouseEvent',
  mouseleave: 'MouseEvent',
};

// Mapping of JSX tags to HTML element types
const jsxElementMap: Record<string, string> = {
  button: 'HTMLButtonElement',
  div: 'HTMLDivElement',
  form: 'HTMLFormElement',
  input: 'HTMLInputElement',
  textarea: 'HTMLTextAreaElement',
  select: 'HTMLSelectElement',
  span: 'HTMLSpanElement',
  a: 'HTMLAnchorElement',
  label: 'HTMLLabelElement',
};

// Detect base React event type
function detectBaseEventType(name: string) {
  const lower = name.toLowerCase();
  for (const key of Object.keys(baseEventMap)) {
    if (lower.includes(key)) return baseEventMap[key];
  }
  return 'SyntheticEvent';
}

// Detect JSX element type
function detectJsxElementType(tagName: string, file: any): string {
  if (jsxElementMap[tagName]) return jsxElementMap[tagName];

  // Try to resolve component type from class, interface, or type alias
  const comp =
    file.getClass(tagName) || file.getInterface(tagName) || file.getTypeAlias(tagName);
  if (comp) {
    const refProp = comp.getProperties().find((p) => p.getName() === 'ref');
    if (refProp) {
      const t = refProp.getTypeAtLocation(file);
      return t.getText() || 'HTMLElement';
    }
  }

  return 'HTMLElement';
}

// Scan all TSX files in client/src and shared
const files = project.getSourceFiles(['client/src/**/*.tsx', 'shared/**/*.tsx']);

files.forEach((file) => {
  let changed = false;

  // Ensure React import exists
  const hasReactImport = file.getImportDeclarations().some(
    (imp: ImportDeclaration) => imp.getModuleSpecifierValue() === 'react'
  );
  if (!hasReactImport) {
    file.insertImportDeclaration(0, { defaultImport: 'React', moduleSpecifier: 'react' });
    changed = true;
    console.log(`ℹ Added React import to: ${file.getFilePath()}`);
  }

  // Handle JSX attributes with arrow functions
  file.forEachDescendant((node) => {
    if (!node.isKind(SyntaxKind.JsxAttribute)) return;

    const jsxAttr = node.asKindOrThrow(SyntaxKind.JsxAttribute) as JsxAttribute;
    const attrNameNode = jsxAttr.getNameNode();
    const attrName = attrNameNode.getText();

    const initializer = jsxAttr.getFirstChildByKind(SyntaxKind.JsxExpression);
    if (!initializer) return;

    const arrowFnNode = initializer.getFirstDescendantByKind(SyntaxKind.ArrowFunction);
    if (!arrowFnNode) return;

    const arrowFn = arrowFnNode as ArrowFunction;

    arrowFn.getParameters().forEach((param: ParameterDeclaration) => {
      if (param.getTypeNode()) return;

      const baseType = detectBaseEventType(attrName);

      const jsxElemNode = jsxAttr.getFirstAncestorByKind(SyntaxKind.JsxOpeningElement);
      const jsxElem = jsxElemNode as JsxOpeningElement | undefined;
      const tagName = jsxElem?.getTagNameNode().getText() || 'HTMLElement';
      const htmlType = detectJsxElementType(tagName, file);

      param.setType(`React.${baseType}<${htmlType}>`);
      changed = true;
    });
  });

  // Handle normal function declarations
  file.getFunctions().forEach((fn) => {
    fn.getParameters().forEach((param: ParameterDeclaration) => {
      if (!param.getTypeNode()) {
        const type = detectBaseEventType(param.getName());
        param.setType(`React.${type}<HTMLElement>`);
        changed = true;
      }
    });
  });

  // Handle arrow functions in variable declarations
  file.getVariableDeclarations().forEach((varDecl) => {
    const init = varDecl.getInitializer();
    if (!init || !init.isKind(SyntaxKind.ArrowFunction)) return;

    const arrowFn = init as ArrowFunction;
    arrowFn.getParameters().forEach((param: ParameterDeclaration) => {
      if (!param.getTypeNode()) {
        const type = detectBaseEventType(param.getName());
        param.setType(`React.${type}<HTMLElement>`);
        changed = true;
      }
    });
  });

  if (changed) {
    console.log(`✅ Updated types in: ${file.getFilePath()}`);
    file.saveSync();
  }
});

console.log('🎉 All React event handler types fixed in client/src and shared!');