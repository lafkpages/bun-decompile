<script lang="ts">
  import type { BunVersion, BundledFile as TBundledFile } from "$lib";

  import { onMount } from "svelte";

  import JSZip from "jszip";

  import { extractBundledFiles, getExecutableVersion } from "$lib";
  import BundledFile from "$lib/components/BundledFile.svelte";

  let files: FileList;
  $: file = files ? files[0] : null;

  let reader: FileReader;

  let bunVersion: BunVersion | null = null;
  let bundledFiles: TBundledFile[] = [];

  let removeBunfsRoot = true;
  let removeLeadingSlash = true;

  let exportBundleDownloadLink: HTMLAnchorElement;

  function decompile() {
    if (!file) {
      alert("Please select a file");
      return;
    }

    bundledFiles.length = 0;
    bundledFiles = bundledFiles;

    reader.readAsArrayBuffer(file);
  }

  async function exportBundle() {
    if (!bundledFiles.length) {
      alert("No bundled files to export");
      return;
    }

    const zip = new JSZip();

    for (const bundledFile of bundledFiles) {
      zip.file(bundledFile.path, bundledFile.contents);

      if (bundledFile.sourcemap) {
        zip.file(`${bundledFile.path}.map`, JSON.stringify(bundledFile.sourcemap, null, 2));
      }
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

      try {
        bunVersion = getExecutableVersion(reader.result);
      } catch (err) {
        console.error("Error getting executable version:", err);
        bunVersion = null;
      }

      try {
        bundledFiles = extractBundledFiles(reader.result, {
          removeBunfsRoot,
          removeLeadingSlash,
        });
      } catch (err) {
        console.error("Error extracting bundled files:", err);
        alert(`Error extracting bundled files:\n${err}`);
      }
    };
  });
</script>

<h1>bun-decompile</h1>

<p>
  Extracts JavaScript sources from an executable file generated via
  <code>bun build --compile</code>.
</p>

<input type="file" id="compiled-binary-upload" bind:files />

<button on:click={decompile} disabled={!file}>Decompile</button>
<button on:click={exportBundle} disabled={!bundledFiles.length}>Export bundle</button>

<a href="#" download="bundle.zip" bind:this={exportBundleDownloadLink}>
  Download exported bundle
</a>

<br />
<br />

<label for="remove-bunfs-root">Remove Bun-fs root</label>
<input type="checkbox" id="remove-bunfs-root" bind:checked={removeBunfsRoot} />

<br />

<label for="remove-leading-slash">Remove leading slash</label>
<input type="checkbox" id="remove-leading-slash" bind:checked={removeLeadingSlash} />

<hr />

<h2>Executable metadata</h2>

<p>
  Bun version:
  {#if bunVersion}
    <a href="https://github.com/oven-sh/bun/releases/bun-v{bunVersion.version}">
      <code>{bunVersion.version}</code>
    </a>
    (<a href="https://github.com/oven-sh/bun/commit/{bunVersion.revision}"
      ><code>{bunVersion.revision}</code></a
    >)
  {:else}
    unknown
  {/if}

  <br />

  Bun version format:
  {#if bunVersion?.newFormat !== undefined}
    <code>{bunVersion.newFormat ? "new" : "old"}</code>
  {:else}
    unknown
  {/if}

  <br />

  <a href="tests.html">Bun versions compatibility</a>
</p>

<h2>Bundled files</h2>

<ul>
  {#each bundledFiles as bundledFile}
    <li>
      <BundledFile {bundledFile} />
    </li>
  {/each}
</ul>

<style>
  a[download] {
    display: none;
  }
</style>
