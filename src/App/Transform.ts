import b from "@babel/core";
import t from "@babel/types";
import { TransformContext } from "./TransformContext";
import { Middleware, Next } from "./compose";

namespace Transform {
  function isConstructor<T extends {}, Args extends any[]>(
    fn: { new (...args: Args): T } | { (...args: Args): T | Promise<T> }
  ): fn is { new (...args: Args): T } {
    return typeof fn === "function" && !!fn.prototype && fn.prototype.constructor === fn;
  }
  export type FactoryArgs<T extends object, Args extends any[]> =
    | [instance: T]
    | [{ new (...args: Args): T } | { (...args: Args): T | Promise<T> }, ...Args];
  type AsyncFactory<T> = () => Promise<T>;
  function createInstance<T extends object>(...factory: FactoryArgs<T, any[]>): AsyncFactory<T> {
    const [instance] = factory;
    if (typeof instance === "object") {
      return () => Promise.resolve(instance);
    } else if (typeof instance === "function") {
      if (isConstructor(instance)) {
        const [arg, ...args] = factory;
        return () => Promise.resolve(new instance(...args));
      } else {
        const [arg, ...args] = factory;
        return () => Promise.resolve(instance(...args));
      }
    }
    throw "";
  }
  function cached<R>(fn: () => R): { (): R } {
    let value: R | undefined = undefined;
    return () => {
      if (!value) value = fn();
      return value;
    };
  }
  export function createMiddleware(
    factory: FactoryArgs<Transform & { start?(context: TransformContext): Promise<void> }, any[]>
  ): Middleware<TransformContext> {
    const visitorFactory = cached(async () => {
      const transform = await createInstance(...factory)();
      return [transform, createVisitor(transform)] as const;
    });
    return async function middleware(context: TransformContext, next?: Next) {
      const [transform, visitor] = await visitorFactory();
      const plugin: b.PluginObj<State> = {
        pre(file) {
          this.context = context;
        },
        visitor,
      };
      await transform.start?.(context);
      await context.transform(plugin);
      if (next) next();
    };
    function createVisitor(transform: Transform): b.Visitor {
      let visitor: any = {};
      for (const [name, value] of Object.entries(transform) as Array<[t.Node["type"], NodeFunction]>) {
        if (!t.TYPES.includes(name)) continue;
        if (!value) continue;
        visitor[name] =
          typeof value === "function"
            ? {
                enter(path: b.NodePath, state: State) {
                  value(path, state);
                },
              }
            : {
                enter(path: b.NodePath, state: State) {
                  value.enter?.(path, state);
                },
                exit(path: b.NodePath, state: State) {
                  value.exit?.(path, state);
                },
              };
      }
      return visitor;
    }
  }
  export interface State extends b.PluginPass {
    context: TransformContext;
  }

  export type NodeFunction<T = t.Node> =
    | { (path: b.NodePath<T>, state: State): void }
    | {
        enter?(path: b.NodePath<T>, state: State): void;
        exit?(path: b.NodePath<T>, state: State): void;
      };
}
export type TransformType = {
  [Key in t.Node["type"]]?: Transform.NodeFunction<Extract<t.Node, { type: Key }>>;
};
interface Transform {
  ArrayExpression?: Transform.NodeFunction<t.ArrayExpression>;
  AssignmentExpression?: Transform.NodeFunction<t.AssignmentExpression>;
  BinaryExpression?: Transform.NodeFunction<t.BinaryExpression>;
  InterpreterDirective?: Transform.NodeFunction<t.InterpreterDirective>;
  Directive?: Transform.NodeFunction<t.Directive>;
  DirectiveLiteral?: Transform.NodeFunction<t.DirectiveLiteral>;
  BlockStatement?: Transform.NodeFunction<t.BlockStatement>;
  BreakStatement?: Transform.NodeFunction<t.BreakStatement>;
  CallExpression?: Transform.NodeFunction<t.CallExpression>;
  CatchClause?: Transform.NodeFunction<t.CatchClause>;
  ConditionalExpression?: Transform.NodeFunction<t.ConditionalExpression>;
  ContinueStatement?: Transform.NodeFunction<t.ContinueStatement>;
  DebuggerStatement?: Transform.NodeFunction<t.DebuggerStatement>;
  DoWhileStatement?: Transform.NodeFunction<t.DoWhileStatement>;
  EmptyStatement?: Transform.NodeFunction<t.EmptyStatement>;
  ExpressionStatement?: Transform.NodeFunction<t.ExpressionStatement>;
  File?: Transform.NodeFunction<t.File>;
  ForInStatement?: Transform.NodeFunction<t.ForInStatement>;
  ForStatement?: Transform.NodeFunction<t.ForStatement>;
  FunctionDeclaration?: Transform.NodeFunction<t.FunctionDeclaration>;
  FunctionExpression?: Transform.NodeFunction<t.FunctionExpression>;
  Identifier?: Transform.NodeFunction<t.Identifier>;
  IfStatement?: Transform.NodeFunction<t.IfStatement>;
  LabeledStatement?: Transform.NodeFunction<t.LabeledStatement>;
  StringLiteral?: Transform.NodeFunction<t.StringLiteral>;
  NumericLiteral?: Transform.NodeFunction<t.NumericLiteral>;
  NullLiteral?: Transform.NodeFunction<t.NullLiteral>;
  BooleanLiteral?: Transform.NodeFunction<t.BooleanLiteral>;
  RegExpLiteral?: Transform.NodeFunction<t.RegExpLiteral>;
  LogicalExpression?: Transform.NodeFunction<t.LogicalExpression>;
  MemberExpression?: Transform.NodeFunction<t.MemberExpression>;
  NewExpression?: Transform.NodeFunction<t.NewExpression>;
  Program?: Transform.NodeFunction<t.Program>;
  ObjectExpression?: Transform.NodeFunction<t.ObjectExpression>;
  ObjectMethod?: Transform.NodeFunction<t.ObjectMethod>;
  ObjectProperty?: Transform.NodeFunction<t.ObjectProperty>;
  RestElement?: Transform.NodeFunction<t.RestElement>;
  ReturnStatement?: Transform.NodeFunction<t.ReturnStatement>;
  SequenceExpression?: Transform.NodeFunction<t.SequenceExpression>;
  ParenthesizedExpression?: Transform.NodeFunction<t.ParenthesizedExpression>;
  SwitchCase?: Transform.NodeFunction<t.SwitchCase>;
  SwitchStatement?: Transform.NodeFunction<t.SwitchStatement>;
  ThisExpression?: Transform.NodeFunction<t.ThisExpression>;
  ThrowStatement?: Transform.NodeFunction<t.ThrowStatement>;
  TryStatement?: Transform.NodeFunction<t.TryStatement>;
  UnaryExpression?: Transform.NodeFunction<t.UnaryExpression>;
  UpdateExpression?: Transform.NodeFunction<t.UpdateExpression>;
  VariableDeclaration?: Transform.NodeFunction<t.VariableDeclaration>;
  VariableDeclarator?: Transform.NodeFunction<t.VariableDeclarator>;
  WhileStatement?: Transform.NodeFunction<t.WhileStatement>;
  WithStatement?: Transform.NodeFunction<t.WithStatement>;
  AssignmentPattern?: Transform.NodeFunction<t.AssignmentPattern>;
  ArrayPattern?: Transform.NodeFunction<t.ArrayPattern>;
  ArrowFunctionExpression?: Transform.NodeFunction<t.ArrowFunctionExpression>;
  ClassBody?: Transform.NodeFunction<t.ClassBody>;
  ClassExpression?: Transform.NodeFunction<t.ClassExpression>;
  ClassDeclaration?: Transform.NodeFunction<t.ClassDeclaration>;
  ExportAllDeclaration?: Transform.NodeFunction<t.ExportAllDeclaration>;
  ExportDefaultDeclaration?: Transform.NodeFunction<t.ExportDefaultDeclaration>;
  ExportNamedDeclaration?: Transform.NodeFunction<t.ExportNamedDeclaration>;
  ExportSpecifier?: Transform.NodeFunction<t.ExportSpecifier>;
  ForOfStatement?: Transform.NodeFunction<t.ForOfStatement>;
  ImportDeclaration?: Transform.NodeFunction<t.ImportDeclaration>;
  ImportDefaultSpecifier?: Transform.NodeFunction<t.ImportDefaultSpecifier>;
  ImportNamespaceSpecifier?: Transform.NodeFunction<t.ImportNamespaceSpecifier>;
  ImportSpecifier?: Transform.NodeFunction<t.ImportSpecifier>;
  MetaProperty?: Transform.NodeFunction<t.MetaProperty>;
  ClassMethod?: Transform.NodeFunction<t.ClassMethod>;
  ObjectPattern?: Transform.NodeFunction<t.ObjectPattern>;
  SpreadElement?: Transform.NodeFunction<t.SpreadElement>;
  Super?: Transform.NodeFunction<t.Super>;
  TaggedTemplateExpression?: Transform.NodeFunction<t.TaggedTemplateExpression>;
  TemplateElement?: Transform.NodeFunction<t.TemplateElement>;
  TemplateLiteral?: Transform.NodeFunction<t.TemplateLiteral>;
  YieldExpression?: Transform.NodeFunction<t.YieldExpression>;
  AwaitExpression?: Transform.NodeFunction<t.AwaitExpression>;
  Import?: Transform.NodeFunction<t.Import>;
  BigIntLiteral?: Transform.NodeFunction<t.BigIntLiteral>;
  ExportNamespaceSpecifier?: Transform.NodeFunction<t.ExportNamespaceSpecifier>;
  OptionalMemberExpression?: Transform.NodeFunction<t.OptionalMemberExpression>;
  OptionalCallExpression?: Transform.NodeFunction<t.OptionalCallExpression>;
  ClassProperty?: Transform.NodeFunction<t.ClassProperty>;
  ClassAccessorProperty?: Transform.NodeFunction<t.ClassAccessorProperty>;
  ClassPrivateProperty?: Transform.NodeFunction<t.ClassPrivateProperty>;
  ClassPrivateMethod?: Transform.NodeFunction<t.ClassPrivateMethod>;
  PrivateName?: Transform.NodeFunction<t.PrivateName>;
  StaticBlock?: Transform.NodeFunction<t.StaticBlock>;
  AnyTypeAnnotation?: Transform.NodeFunction<t.AnyTypeAnnotation>;
  ArrayTypeAnnotation?: Transform.NodeFunction<t.ArrayTypeAnnotation>;
  BooleanTypeAnnotation?: Transform.NodeFunction<t.BooleanTypeAnnotation>;
  BooleanLiteralTypeAnnotation?: Transform.NodeFunction<t.BooleanLiteralTypeAnnotation>;
  NullLiteralTypeAnnotation?: Transform.NodeFunction<t.NullLiteralTypeAnnotation>;
  ClassImplements?: Transform.NodeFunction<t.ClassImplements>;
  DeclareClass?: Transform.NodeFunction<t.DeclareClass>;
  DeclareFunction?: Transform.NodeFunction<t.DeclareFunction>;
  DeclareInterface?: Transform.NodeFunction<t.DeclareInterface>;
  DeclareModule?: Transform.NodeFunction<t.DeclareModule>;
  DeclareModuleExports?: Transform.NodeFunction<t.DeclareModuleExports>;
  DeclareTypeAlias?: Transform.NodeFunction<t.DeclareTypeAlias>;
  DeclareOpaqueType?: Transform.NodeFunction<t.DeclareOpaqueType>;
  DeclareVariable?: Transform.NodeFunction<t.DeclareVariable>;
  DeclareExportDeclaration?: Transform.NodeFunction<t.DeclareExportDeclaration>;
  DeclareExportAllDeclaration?: Transform.NodeFunction<t.DeclareExportAllDeclaration>;
  DeclaredPredicate?: Transform.NodeFunction<t.DeclaredPredicate>;
  ExistsTypeAnnotation?: Transform.NodeFunction<t.ExistsTypeAnnotation>;
  FunctionTypeAnnotation?: Transform.NodeFunction<t.FunctionTypeAnnotation>;
  FunctionTypeParam?: Transform.NodeFunction<t.FunctionTypeParam>;
  GenericTypeAnnotation?: Transform.NodeFunction<t.GenericTypeAnnotation>;
  InferredPredicate?: Transform.NodeFunction<t.InferredPredicate>;
  InterfaceExtends?: Transform.NodeFunction<t.InterfaceExtends>;
  InterfaceDeclaration?: Transform.NodeFunction<t.InterfaceDeclaration>;
  InterfaceTypeAnnotation?: Transform.NodeFunction<t.InterfaceTypeAnnotation>;
  IntersectionTypeAnnotation?: Transform.NodeFunction<t.IntersectionTypeAnnotation>;
  MixedTypeAnnotation?: Transform.NodeFunction<t.MixedTypeAnnotation>;
  EmptyTypeAnnotation?: Transform.NodeFunction<t.EmptyTypeAnnotation>;
  NullableTypeAnnotation?: Transform.NodeFunction<t.NullableTypeAnnotation>;
  NumberLiteralTypeAnnotation?: Transform.NodeFunction<t.NumberLiteralTypeAnnotation>;
  NumberTypeAnnotation?: Transform.NodeFunction<t.NumberTypeAnnotation>;
  ObjectTypeAnnotation?: Transform.NodeFunction<t.ObjectTypeAnnotation>;
  ObjectTypeInternalSlot?: Transform.NodeFunction<t.ObjectTypeInternalSlot>;
  ObjectTypeCallProperty?: Transform.NodeFunction<t.ObjectTypeCallProperty>;
  ObjectTypeIndexer?: Transform.NodeFunction<t.ObjectTypeIndexer>;
  ObjectTypeProperty?: Transform.NodeFunction<t.ObjectTypeProperty>;
  ObjectTypeSpreadProperty?: Transform.NodeFunction<t.ObjectTypeSpreadProperty>;
  OpaqueType?: Transform.NodeFunction<t.OpaqueType>;
  QualifiedTypeIdentifier?: Transform.NodeFunction<t.QualifiedTypeIdentifier>;
  StringLiteralTypeAnnotation?: Transform.NodeFunction<t.StringLiteralTypeAnnotation>;
  StringTypeAnnotation?: Transform.NodeFunction<t.StringTypeAnnotation>;
  SymbolTypeAnnotation?: Transform.NodeFunction<t.SymbolTypeAnnotation>;
  ThisTypeAnnotation?: Transform.NodeFunction<t.ThisTypeAnnotation>;
  TupleTypeAnnotation?: Transform.NodeFunction<t.TupleTypeAnnotation>;
  TypeofTypeAnnotation?: Transform.NodeFunction<t.TypeofTypeAnnotation>;
  TypeAlias?: Transform.NodeFunction<t.TypeAlias>;
  TypeAnnotation?: Transform.NodeFunction<t.TypeAnnotation>;
  TypeCastExpression?: Transform.NodeFunction<t.TypeCastExpression>;
  TypeParameter?: Transform.NodeFunction<t.TypeParameter>;
  TypeParameterDeclaration?: Transform.NodeFunction<t.TypeParameterDeclaration>;
  TypeParameterInstantiation?: Transform.NodeFunction<t.TypeParameterInstantiation>;
  UnionTypeAnnotation?: Transform.NodeFunction<t.UnionTypeAnnotation>;
  Variance?: Transform.NodeFunction<t.Variance>;
  VoidTypeAnnotation?: Transform.NodeFunction<t.VoidTypeAnnotation>;
  EnumDeclaration?: Transform.NodeFunction<t.EnumDeclaration>;
  EnumBooleanBody?: Transform.NodeFunction<t.EnumBooleanBody>;
  EnumNumberBody?: Transform.NodeFunction<t.EnumNumberBody>;
  EnumStringBody?: Transform.NodeFunction<t.EnumStringBody>;
  EnumSymbolBody?: Transform.NodeFunction<t.EnumSymbolBody>;
  EnumBooleanMember?: Transform.NodeFunction<t.EnumBooleanMember>;
  EnumNumberMember?: Transform.NodeFunction<t.EnumNumberMember>;
  EnumStringMember?: Transform.NodeFunction<t.EnumStringMember>;
  EnumDefaultedMember?: Transform.NodeFunction<t.EnumDefaultedMember>;
  IndexedAccessType?: Transform.NodeFunction<t.IndexedAccessType>;
  OptionalIndexedAccessType?: Transform.NodeFunction<t.OptionalIndexedAccessType>;
  JSXAttribute?: Transform.NodeFunction<t.JSXAttribute>;
  JSXClosingElement?: Transform.NodeFunction<t.JSXClosingElement>;
  JSXElement?: Transform.NodeFunction<t.JSXElement>;
  JSXEmptyExpression?: Transform.NodeFunction<t.JSXEmptyExpression>;
  JSXExpressionContainer?: Transform.NodeFunction<t.JSXExpressionContainer>;
  JSXSpreadChild?: Transform.NodeFunction<t.JSXSpreadChild>;
  JSXIdentifier?: Transform.NodeFunction<t.JSXIdentifier>;
  JSXMemberExpression?: Transform.NodeFunction<t.JSXMemberExpression>;
  JSXNamespacedName?: Transform.NodeFunction<t.JSXNamespacedName>;
  JSXOpeningElement?: Transform.NodeFunction<t.JSXOpeningElement>;
  JSXSpreadAttribute?: Transform.NodeFunction<t.JSXSpreadAttribute>;
  JSXText?: Transform.NodeFunction<t.JSXText>;
  JSXFragment?: Transform.NodeFunction<t.JSXFragment>;
  JSXOpeningFragment?: Transform.NodeFunction<t.JSXOpeningFragment>;
  JSXClosingFragment?: Transform.NodeFunction<t.JSXClosingFragment>;
  Noop?: Transform.NodeFunction<t.Noop>;
  Placeholder?: Transform.NodeFunction<t.Placeholder>;
  V8IntrinsicIdentifier?: Transform.NodeFunction<t.V8IntrinsicIdentifier>;
  ArgumentPlaceholder?: Transform.NodeFunction<t.ArgumentPlaceholder>;
  BindExpression?: Transform.NodeFunction<t.BindExpression>;
  ImportAttribute?: Transform.NodeFunction<t.ImportAttribute>;
  Decorator?: Transform.NodeFunction<t.Decorator>;
  DoExpression?: Transform.NodeFunction<t.DoExpression>;
  ExportDefaultSpecifier?: Transform.NodeFunction<t.ExportDefaultSpecifier>;
  RecordExpression?: Transform.NodeFunction<t.RecordExpression>;
  TupleExpression?: Transform.NodeFunction<t.TupleExpression>;
  DecimalLiteral?: Transform.NodeFunction<t.DecimalLiteral>;
  ModuleExpression?: Transform.NodeFunction<t.ModuleExpression>;
  TopicReference?: Transform.NodeFunction<t.TopicReference>;
  PipelineTopicExpression?: Transform.NodeFunction<t.PipelineTopicExpression>;
  PipelineBareFunction?: Transform.NodeFunction<t.PipelineBareFunction>;
  PipelinePrimaryTopicReference?: Transform.NodeFunction<t.PipelinePrimaryTopicReference>;
  TSParameterProperty?: Transform.NodeFunction<t.TSParameterProperty>;
  TSDeclareFunction?: Transform.NodeFunction<t.TSDeclareFunction>;
  TSDeclareMethod?: Transform.NodeFunction<t.TSDeclareMethod>;
  TSQualifiedName?: Transform.NodeFunction<t.TSQualifiedName>;
  TSCallSignatureDeclaration?: Transform.NodeFunction<t.TSCallSignatureDeclaration>;
  TSConstructSignatureDeclaration?: Transform.NodeFunction<t.TSConstructSignatureDeclaration>;
  TSPropertySignature?: Transform.NodeFunction<t.TSPropertySignature>;
  TSMethodSignature?: Transform.NodeFunction<t.TSMethodSignature>;
  TSIndexSignature?: Transform.NodeFunction<t.TSIndexSignature>;
  TSAnyKeyword?: Transform.NodeFunction<t.TSAnyKeyword>;
  TSBooleanKeyword?: Transform.NodeFunction<t.TSBooleanKeyword>;
  TSBigIntKeyword?: Transform.NodeFunction<t.TSBigIntKeyword>;
  TSIntrinsicKeyword?: Transform.NodeFunction<t.TSIntrinsicKeyword>;
  TSNeverKeyword?: Transform.NodeFunction<t.TSNeverKeyword>;
  TSNullKeyword?: Transform.NodeFunction<t.TSNullKeyword>;
  TSNumberKeyword?: Transform.NodeFunction<t.TSNumberKeyword>;
  TSObjectKeyword?: Transform.NodeFunction<t.TSObjectKeyword>;
  TSStringKeyword?: Transform.NodeFunction<t.TSStringKeyword>;
  TSSymbolKeyword?: Transform.NodeFunction<t.TSSymbolKeyword>;
  TSUndefinedKeyword?: Transform.NodeFunction<t.TSUndefinedKeyword>;
  TSUnknownKeyword?: Transform.NodeFunction<t.TSUnknownKeyword>;
  TSVoidKeyword?: Transform.NodeFunction<t.TSVoidKeyword>;
  TSThisType?: Transform.NodeFunction<t.TSThisType>;
  TSFunctionType?: Transform.NodeFunction<t.TSFunctionType>;
  TSConstructorType?: Transform.NodeFunction<t.TSConstructorType>;
  TSTypeReference?: Transform.NodeFunction<t.TSTypeReference>;
  TSTypePredicate?: Transform.NodeFunction<t.TSTypePredicate>;
  TSTypeQuery?: Transform.NodeFunction<t.TSTypeQuery>;
  TSTypeLiteral?: Transform.NodeFunction<t.TSTypeLiteral>;
  TSArrayType?: Transform.NodeFunction<t.TSArrayType>;
  TSTupleType?: Transform.NodeFunction<t.TSTupleType>;
  TSOptionalType?: Transform.NodeFunction<t.TSOptionalType>;
  TSRestType?: Transform.NodeFunction<t.TSRestType>;
  TSNamedTupleMember?: Transform.NodeFunction<t.TSNamedTupleMember>;
  TSUnionType?: Transform.NodeFunction<t.TSUnionType>;
  TSIntersectionType?: Transform.NodeFunction<t.TSIntersectionType>;
  TSConditionalType?: Transform.NodeFunction<t.TSConditionalType>;
  TSInferType?: Transform.NodeFunction<t.TSInferType>;
  TSParenthesizedType?: Transform.NodeFunction<t.TSParenthesizedType>;
  TSTypeOperator?: Transform.NodeFunction<t.TSTypeOperator>;
  TSIndexedAccessType?: Transform.NodeFunction<t.TSIndexedAccessType>;
  TSMappedType?: Transform.NodeFunction<t.TSMappedType>;
  TSLiteralType?: Transform.NodeFunction<t.TSLiteralType>;
  TSExpressionWithTypeArguments?: Transform.NodeFunction<t.TSExpressionWithTypeArguments>;
  TSInterfaceDeclaration?: Transform.NodeFunction<t.TSInterfaceDeclaration>;
  TSInterfaceBody?: Transform.NodeFunction<t.TSInterfaceBody>;
  TSTypeAliasDeclaration?: Transform.NodeFunction<t.TSTypeAliasDeclaration>;
  TSAsExpression?: Transform.NodeFunction<t.TSAsExpression>;
  TSTypeAssertion?: Transform.NodeFunction<t.TSTypeAssertion>;
  TSEnumDeclaration?: Transform.NodeFunction<t.TSEnumDeclaration>;
  TSEnumMember?: Transform.NodeFunction<t.TSEnumMember>;
  TSModuleDeclaration?: Transform.NodeFunction<t.TSModuleDeclaration>;
  TSModuleBlock?: Transform.NodeFunction<t.TSModuleBlock>;
  TSImportType?: Transform.NodeFunction<t.TSImportType>;
  TSImportEqualsDeclaration?: Transform.NodeFunction<t.TSImportEqualsDeclaration>;
  TSExternalModuleReference?: Transform.NodeFunction<t.TSExternalModuleReference>;
  TSNonNullExpression?: Transform.NodeFunction<t.TSNonNullExpression>;
  TSExportAssignment?: Transform.NodeFunction<t.TSExportAssignment>;
  TSNamespaceExportDeclaration?: Transform.NodeFunction<t.TSNamespaceExportDeclaration>;
  TSTypeAnnotation?: Transform.NodeFunction<t.TSTypeAnnotation>;
  TSTypeParameterInstantiation?: Transform.NodeFunction<t.TSTypeParameterInstantiation>;
  TSTypeParameterDeclaration?: Transform.NodeFunction<t.TSTypeParameterDeclaration>;
  TSTypeParameter?: Transform.NodeFunction<t.TSTypeParameter>;
  Standardized?: Transform.NodeFunction<t.Standardized>;
  Expression?: Transform.NodeFunction<t.Expression>;
  Binary?: Transform.NodeFunction<t.Binary>;
  Scopable?: Transform.NodeFunction<t.Scopable>;
  BlockParent?: Transform.NodeFunction<t.BlockParent>;
  Block?: Transform.NodeFunction<t.Block>;
  Statement?: Transform.NodeFunction<t.Statement>;
  Terminatorless?: Transform.NodeFunction<t.Terminatorless>;
  CompletionStatement?: Transform.NodeFunction<t.CompletionStatement>;
  Conditional?: Transform.NodeFunction<t.Conditional>;
  Loop?: Transform.NodeFunction<t.Loop>;
  While?: Transform.NodeFunction<t.While>;
  ExpressionWrapper?: Transform.NodeFunction<t.ExpressionWrapper>;
  For?: Transform.NodeFunction<t.For>;
  ForXStatement?: Transform.NodeFunction<t.ForXStatement>;
  Function?: Transform.NodeFunction<t.Function>;
  FunctionParent?: Transform.NodeFunction<t.FunctionParent>;
  Pureish?: Transform.NodeFunction<t.Pureish>;
  Declaration?: Transform.NodeFunction<t.Declaration>;
  PatternLike?: Transform.NodeFunction<t.PatternLike>;
  LVal?: Transform.NodeFunction<t.LVal>;
  TSEntityName?: Transform.NodeFunction<t.TSEntityName>;
  Literal?: Transform.NodeFunction<t.Literal>;
  Immutable?: Transform.NodeFunction<t.Immutable>;
  UserWhitespacable?: Transform.NodeFunction<t.UserWhitespacable>;
  Method?: Transform.NodeFunction<t.Method>;
  ObjectMember?: Transform.NodeFunction<t.ObjectMember>;
  Property?: Transform.NodeFunction<t.Property>;
  UnaryLike?: Transform.NodeFunction<t.UnaryLike>;
  Pattern?: Transform.NodeFunction<t.Pattern>;
  Class?: Transform.NodeFunction<t.Class>;
  ModuleDeclaration?: Transform.NodeFunction<t.ModuleDeclaration>;
  ExportDeclaration?: Transform.NodeFunction<t.ExportDeclaration>;
  ModuleSpecifier?: Transform.NodeFunction<t.ModuleSpecifier>;
  Accessor?: Transform.NodeFunction<t.Accessor>;
  Private?: Transform.NodeFunction<t.Private>;
  Flow?: Transform.NodeFunction<t.Flow>;
  FlowType?: Transform.NodeFunction<t.FlowType>;
  FlowBaseAnnotation?: Transform.NodeFunction<t.FlowBaseAnnotation>;
  FlowDeclaration?: Transform.NodeFunction<t.FlowDeclaration>;
  FlowPredicate?: Transform.NodeFunction<t.FlowPredicate>;
  EnumBody?: Transform.NodeFunction<t.EnumBody>;
  EnumMember?: Transform.NodeFunction<t.EnumMember>;
  JSX?: Transform.NodeFunction<t.JSX>;
  Miscellaneous?: Transform.NodeFunction<t.Miscellaneous>;
  TypeScript?: Transform.NodeFunction<t.TypeScript>;
  TSTypeElement?: Transform.NodeFunction<t.TSTypeElement>;
  TSType?: Transform.NodeFunction<t.TSType>;
  TSBaseType?: Transform.NodeFunction<t.TSBaseType>;
  NumberLiteral?: Transform.NodeFunction<t.NumberLiteral>;
  RegexLiteral?: Transform.NodeFunction<t.RegexLiteral>;
  RestProperty?: Transform.NodeFunction<t.RestProperty>;
  SpreadProperty?: Transform.NodeFunction<t.SpreadProperty>;
}
export default Transform;
