<script lang="ts">
  import type { BundledFile } from "$lib";

  import { type Entry } from "@luisafk/minifs";
  import { File, Folder, FolderOpen } from "lucide-svelte";

  type FileTreeEntry = Entry<BundledFile>;
  export let entry: FileTreeEntry;
  export let indent = 0;

  export let open = false;
</script>

{#if entry.isDirectory()}
  <button
    class="filetree-entry"
    style:--indent={indent}
    on:click={() => {
      open = !open;
    }}
  >
    {#if open}
      <FolderOpen />
    {:else}
      <Folder />
    {/if}
    {entry.name}
  </button>

  {#if open}
    {#each Object.values(entry.content) as child}
      <svelte:self entry={child} indent={indent + 1} on:click />
    {/each}
  {/if}
{:else}
  <button class="filetree-entry" style:--indent={indent} on:click>
    <File />
    {entry.name}
  </button>
{/if}

<style lang="scss">
  .filetree-entry {
    appearance: none;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px;
    padding-left: calc(2px + var(--indent) * 16px);
    border: none;
    background-color: gainsboro;
    cursor: pointer;

    &:hover {
      background-color: lightgray;
    }
  }
</style>
