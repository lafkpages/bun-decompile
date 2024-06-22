<script lang="ts">
  import type { BundledFile as TBundledFile } from "$lib";

  import { onMount } from "svelte";

  import { extractBundledFiles } from "$lib";
  import BundledFile from "$lib/components/BundledFile.svelte";

  let files: FileList;
  $: file = files ? files[0] : null;

  let reader: FileReader;

  let bundledFiles: TBundledFile[] = [];

  function decompile() {
    if (!file) {
      alert("Please select a file");
      return;
    }

    reader.readAsArrayBuffer(file);
  }

  onMount(() => {
    reader = new FileReader();
    reader.onload = () => {
      if (!reader.result || typeof reader.result === "string") {
        return;
      }

      bundledFiles = extractBundledFiles(reader.result);

      console.log(bundledFiles);
    };
  });
</script>

<h1>bun-decompile</h1>

<input type="file" id="compiled-binary-upload" bind:files />

<button on:click={decompile} disabled={!file}>Decompile</button>

<hr />

<ul>
  {#each bundledFiles as bundledFile}
    <li>
      <BundledFile {bundledFile} />
    </li>
  {/each}
</ul>
