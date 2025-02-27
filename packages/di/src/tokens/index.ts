import { Container } from '../container';

/**
 * This is a token, it will help you get current module(~ container) reference.
 *
 * **Usage:**
 * ```ts
 * import { Module, OnInit } from '@cellularjs/di';
 *
 * @Module({
 *   providers: [
 *     { token: 'foo', useValue: 'bar' },
 *   ],
 * })
 * export class YourModule implements OnInit {
 *   constructor(
 *     private thisModule: ThisModule;
 *   ) { }
 *
 *   async onInit() {
 *     await thisModule.resolve('foo'); // 'bar'
 *   }
 * }
 * ```
 */
export class ModuleRef extends Container {}
