<div class="bar">
  <slot />
</div>

<style lang="scss">
  @use 'sass:math';

  $size: math.div(22rem, 16);

  .bar {
    height: $size;
    min-width: $size;
    min-height: $size;
  }
</style>
