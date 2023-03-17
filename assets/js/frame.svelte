<div class="frame">
  <slot />
</div>

<style lang="scss">
  @use 'sass:math';

  .frame {
    border-top: var(--frame-border-size) solid var(--color-background-600);
    border-left: var(--frame-border-size) solid var(--color-background-600);
    border-right: var(--frame-border-size) solid var(--color-background-50);
    border-bottom: var(--frame-border-size) solid var(--color-background-50);
  }
</style>
