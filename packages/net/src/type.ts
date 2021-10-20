import { GenericProvider, ImportableCnf, ClassType, FuncType, Container } from '@cellularjs/di';
import { CellContext } from './';
import { CellularIRS } from './message';

export type PipeData = {
  irq: CellularIRS;
  state: ObjectType;
}

/**
 * *Pros:
 * - it support dependency injection.
 * 
 * *Cons:
 * - can not pass argument.
 */
export interface PipeAsClass {
  process(next: FuncType<void>, pipeData: PipeData): void;
}

/**
 * Simple pipe
 */
export type PipeAsFunc = (next: FuncType<void>, pipeData: PipeData) => void;

export type GenericPipe = ClassType<PipeAsClass> | PipeAsFunc;

export type ObjectType = { [key: string]: any };

export enum ServiceScopeMap {
  public = 1,
  space = 2,
  private = 4,
}

export type ServiceScope = keyof typeof ServiceScopeMap;

export enum RoutingTypeMap {
  unicast = 1,
  multicast = 2,
}

export type RoutingType = keyof typeof RoutingTypeMap;

/**
 * Service handler meta data.
 */
export interface ServiceMeta {
  /**
   * Scope define accessibility for event handler. It make event handler look
   * like a method in a class with access modifier.
   * 
   * - "public": accessible from anywhere.
   * - "space": limit access only to cells having same space.
   * - "private": limit access to owner cell only.
   * 
   * *By default, the scope value is "space".*
   */
  scope?: ServiceScope;

  /**
   * Route specify how Transportor deliver message to event handler(s).
   * - "unicast": send message to a specific event handler of a cell.
   * - "multicast": send message to all event handlers interesting in the event.
   * 
   * *By default, the route value is "unicast".*
   */
  route?: RoutingType;

  /**
   * Service handler pipeline(or middlewares), it will run before event handler.
   */
  pipes?: GenericPipe[];
}

export interface AjustedServiceMeta {
  scope: ServiceScopeMap;
  route: RoutingTypeMap;
  pipes: GenericPipe[];
}

export type CellProviderConfig = GenericProvider<any> | string;

export interface CellMeta {
  /**
   * It define set of providers for current cell.
   */
  providers?: CellProviderConfig[];

  /**
   * Compatible with @cellularjs/di, it define set of modules that will be imported
   * into current cell.
   */
  imports?: ImportableCnf[];

  // exports?: []; Noop. You can consider cell as a root container so it does not
  // have any exports at all.

  /**
   * DRAFT
   * 
   * Cell pipeline, it run before all pipes of event handler.
   * 
   * Pipe is basic component for creating a pipeline(or middlewares). Pipe is only
   * allowed to modified shared state which is explicitly declared(`data.state`).
   * To breaking pipeline you can throw an error inside pipe. And as usual, error
   * will be transformed into error IRS.
   */
  pipes?: GenericPipe[];

  /**
   * Cell context hold information of current cell. With this property, you can
   * define your own custom cell context(extended from CellContext).
   */
  context?: ClassType<CellContext>;

  /**
   * If argument is a string, it will be treated as a path to a folder. It
   * will scan that folder(include sub folder) to get event handler automatically.
   * Service name in this case will be same as class name.<br/>
   * *Example: `"./events"`*<br/>
   * 
   * You can also define key-pair of event name and event handler class.<br/>
   * *Example:*<br/>
   * ```
   * {
   *   SignUp, // short type, class name is event name.
   *   "any string": SignIn, // explicit type.
   * }
   * ```
   * 
   * _CellularJS support many type but it is better to use a consistent type._
   */
  listen: string | { [eventName: string]: ClassType<ServiceHandler> };
}

/**
 * Draft
 */
export type IrqHeader = {
  unicast?: `${string}:${string}`;
  multicast?: string;
  [key: string]: any;
};

export type IrsHeader = {
  status: number;
  [key: string]: any;
};

/**
 * Cell service handler.
 */
export interface ServiceHandler {
  handle(): CellularIRS | Promise<CellularIRS>;
}

/**
 * Cell config contain cell infomation. You can get a cell config by invoking
 * `getResolvedCell('cell name')`.
 */
export interface CellConfig {
  /**
   * Cell name or cell type, it must be unique. Cell name are able to be used for
   * unicast routing request.
   * 
   * **TIP**: *For better performance when comparing 2 cell name, let use `cellId`
   * (call `getResolvedCell(cellName)` to get `cellId`).*
   */
  name: string;

  /**
   * Space is used to specify the relationship of cells. If two cells have same
   * space, they are considered as in the same location and vice versa.
   * 
   * **TIP**: *For better performance when comparing 2 space, let use `spaceId`
   * (call `getResolvedCell(cellName)` to get `spaceId`).*
   */
  space?: string;

  /**
   * Instead of choosing communication technique for you, @cellularjs/net let you
   * do it by yourself. With this kind of strategy, your ability is not limit by
   * @cellularjs/net.
   * 
   * You can define many type of drivers with key-pair object. If you pass a class,
   * it will be treated as local driver.
   * 
   * Example:
   * ```
   * AuthLocal
   * // or
   * {
   *   local: AuthLocal,
   *   http: AuthHttp",
   *   any: AuthAny",
   * }
   * ```
   */
  driver: {
    local?: { new() };
    [driverName: string]: { new() };
  } | { new() };

  /**
   * In additional to reserved property defined by @cellularjs/net, you can add
   * more custom data with this property.
   * 
   * You can get your customData by calling `getResolvedCell(cellNamme)`.
   */
  customData?: { [key: string]: any };
}

/**
 * If you have a cell, you have a network. If you have many cells, you have a big network.
 */
export type NetworkConfig = Array<CellConfig>;

export type ServiceHandlerMap = Map<string, ClassType<ServiceHandler>>

export interface ResolvedDriver {
  container: Container;
  listener: ServiceHandlerMap;
}

export interface ResolvedCell {
  /**
   * `cellId` is short version of `CellConfig.name`. It is usefull for task
   * like cell comparation.
   */
  cellId: number;

  /**
   * `spaceId` is short version of `CellConfig.space`. It is usefull for task
   * like space comparation.
   */
  spaceId: number;

  cellConfig: CellConfig;

  drivers: Map<string, ResolvedDriver>;
}

export type NetworkOptions = {
  /**
   * Number of thread to create network.
   */
  thread?: number;
}