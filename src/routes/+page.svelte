<script lang="ts">
  import type { BundledFile as TBundledFile } from "$lib";

  import { onMount } from "svelte";

  import JSZip from "jszip";

  import { extractBundledFiles, removeBunfsRootFromPath } from "$lib";
  import BundledFile from "$lib/components/BundledFile.svelte";

  let files: FileList;
  $: file = files ? files[0] : null;

  let reader: FileReader;

  let bundledFiles: TBundledFile[] = [];

  let removeBunfsRoot = true;

  let exportBundleDownloadLink: HTMLAnchorElement;

  function decompile() {
    if (!file) {
      alert("Please select a file");
      return;
    }

    reader.readAsArrayBuffer(file);
  }

  async function exportBundle() {
    if (!bundledFiles.length) {
      alert("No bundled files to export");
      return;
    }

    const zip = new JSZip();

    for (const bundledFile of bundledFiles) {
      const path = removeBunfsRoot ? removeBunfsRootFromPath(bundledFile.path) : bundledFile.path;

      zip.file(path, bundledFile.contents);
    }

    const zipData = await zip.generateAsync({ type: "base64" });

    exportBundleDownloadLink.href = `data:application/zip;base64,${zipData}`;
    exportBundleDownloadLink.click();
  }

  onMount(() => {
    reader = new FileReader();
    reader.onload = () => {
      if (!reader.result || typeof reader.result === "string") {
        return;
      }

      bundledFiles = extractBundledFiles(reader.result);
    };
  });
</script>

<h1>bun-decompile</h1>

<input type="file" id="compiled-binary-upload" bind:files />

<button on:click={decompile} disabled={!file}>Decompile</button>
<button on:click={exportBundle} disabled={!bundledFiles.length}>Export bundle</button>

<a href="#" download="bundle.zip" bind:this={exportBundleDownloadLink}>
  Download exported bundle
</a>

<br />
<br />

<label for="remove-bunfs-root">Remove bunfs root</label>
<input type="checkbox" id="remove-bunfs-root" bind:checked={removeBunfsRoot} />

<hr />

<ul>
  {#each bundledFiles as bundledFile}
    <li>
      <BundledFile {bundledFile} {removeBunfsRoot} />
    </li>
  {/each}
</ul>

<style>
  a {
    display: none;
  }
</style>
