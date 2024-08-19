<script lang="ts">
  import type { File } from "@luisafk/minifs";
  import type { BunVersion, BundledFile as TBundledFile } from "$lib";

  import { onMount } from "svelte";

  import { MiniFS } from "@luisafk/minifs";
  import JSZip from "jszip";

  import { extractBundledFiles, getExecutableVersion } from "$lib";
  import BundledFile from "$lib/components/BundledFile.svelte";
  import FileTreeEntry from "$lib/components/FileTreeEntry.svelte";

  let files: FileList;
  $: file = files ? files[0] : null;

  let reader: FileReader;

  let bunVersion: BunVersion | null = null;
  $: bunVersionForRelease = bunVersion?.version.replace(/-[\w.-]+$/i, "");

  let bundledFiles: TBundledFile[] = [];
  let bundledFileTree: MiniFS<TBundledFile> | null = null;
  let selectedEntry: File<TBundledFile> | null = null;

  let normaliseEntrypointFileName = true;

  let exportBundleDownloadLink: HTMLAnchorElement;

  function decompile() {
    if (!file) {
      alert("Please select a file");
      return;
    }

    bundledFiles.length = 0;
    bundledFiles = bundledFiles;
    bundledFileTree = null;
    selectedEntry = null;

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
          normaliseEntrypointFileName,
        });

        bundledFileTree = new MiniFS({ preferErrors: true });

        for (const bundledFile of bundledFiles) {
          bundledFileTree.writeFile(bundledFile.path, bundledFile);
        }

        selectedEntry = bundledFileTree.readFile(bundledFiles[0].path, { returnEntry: true });
      } catch (err) {
        console.error("Error extracting bundled files:", err);
        alert(`Error extracting bundled files:\n${err}`);
      }
    };
  });
</script>

<h1>bun-decompile</h1>

<p>
  Extracts the original transpiled sources from an executable file generated via
  <code>bun build --compile</code>.
</p>

<input type="file" id="compiled-binary-upload" bind:files />

<button on:click={decompile} disabled={!file}>Decompile</button>
<button on:click={exportBundle} disabled={!bundledFiles.length}>Export bundle</button>

<a
  href="data:application/zip;base64,"
  download="bundle.zip"
  hidden
  bind:this={exportBundleDownloadLink}
>
  Download exported bundle
</a>

<br />
<br />

<input
  type="checkbox"
  id="normalise-entrypoint-file-name"
  bind:checked={normaliseEntrypointFileName}
/>
<label for="normalise-entrypoint-file-name">Normalise entrypoint file name</label>

<hr />

<h2>Executable metadata</h2>

<p>
  Bun version:
  {#if bunVersion}
    <a href="https://github.com/oven-sh/bun/releases/bun-v{bunVersionForRelease}">
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

{#if bundledFileTree}
  {@const rootEntries = bundledFileTree.readDirectory([], { returnEntry: true })}

  {#if rootEntries}
    <div>
      {#each Object.values(rootEntries.content) as entry}
        <FileTreeEntry
          {entry}
          on:click={() => {
            if (entry.isFile()) {
              selectedEntry = entry;
            }
          }}
        />
      {/each}
    </div>
  {/if}
{/if}

{#if selectedEntry}
  <BundledFile file={selectedEntry} />
{/if}

<style>
  a[hidden] {
    display: none;
  }
</style>
