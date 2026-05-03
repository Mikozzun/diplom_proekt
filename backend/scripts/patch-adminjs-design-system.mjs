/*
  CI-safe no-op patch hook.
  The project expects this file in postinstall during Docker builds.
*/
console.log('[postinstall] patch-adminjs-design-system: no-op');
