little_endian

include "Utility/General.tcl"

# Trailer: \n---- Bun! ----\n
requires [expr [len] - 24] "0A 2D 2D 2D 2D 20 42 75 6E 21 20 2D 2D 2D 2D 0A"

proc debug {body} {
    # Comment or uncomment next line
    #uplevel 1 $body
}

main_guard {
    section "Trailer metadata" {
        goto [len]
        move -8
        set binSize [uint32]

        check { $binSize == [len] }

        goto [len]
        move -68

        sentry 36 {
            set payloadSize [expr [uint32] + [uint32]]
            debug {
                move -8
                entry "Payload size" $payloadSize 8
                move 8
            }

            move 12
            set offsetByteCount [uint32]
            debug {
                move -4
                entry "Offset byte count" $offsetByteCount 4
                move 4
            }

            uint32 "Entrypoint ID"

            set modulesPtrOffset [uint32]
            set modulesPtrLength [uint32]
            debug {
                move -8
                entry "Modules pointer offset" $modulesPtrOffset 4
                move 4
                entry "Modules pointer length" $modulesPtrLength 4
                move 4
            }

            set modulesStart [expr [len] - ( $offsetByteCount + 48 )]
            set modulesEnd [expr $modulesStart + $modulesPtrOffset]
            debug {
                entry "Modules start" $modulesStart $modulesPtrOffset $modulesStart
                entry "Modules end" $modulesEnd $modulesPtrOffset $modulesStart
            }
        }

        # New format is either 1 or 0
        set newFormat [expr $payloadSize + 1 == $modulesPtrOffset]
        if {$newFormat} {
            entry "Format" "new"
            set modulesMetadataChunkSize 28
        } else {
            entry "Format" "old"
            set modulesMetadataChunkSize 32
        }

        goto $modulesEnd
        set dataOffset 0
        for {set i 0} {$i < $modulesPtrLength / $modulesMetadataChunkSize} {incr i} {
            section "Bundled file" {
                move 4
                set pathLength [uint32]
                debug {
                    move -4
                    entry "Path length" $pathLength 4
                    move 4
                }
                jumpa [expr $modulesStart + $dataOffset] {
                    ascii $pathLength "Path"
                    incr dataOffset [expr $pathLength + $newFormat]
                }

                move 4
                set contentLength [uint32]
                debug {
                    move -4
                    entry "Content length" $contentLength 4
                    move 4
                }
                set contentStart [expr $modulesStart + $dataOffset]
                set contentEnd [expr $contentStart + $contentLength]
                jumpa $contentStart {
                    bytes $contentLength "Content"
                    incr dataOffset [expr $contentLength + $newFormat]
                }

                move 4
                set sourcemapLength [uint32]
                debug {
                    move -4
                    entry "Sourcemap length" $sourcemapLength 4
                    move 4
                }
                if {$sourcemapLength} {
                    jumpa [expr $contentEnd + 5] {
                        set sourcemapMappingsLength [uint32]
                        debug {
                            move -4
                            entry "Sourcemap mappings length" $sourcemapMappingsLength 4
                        }
                    }

                    if {$sourcemapMappingsLength} {
                        jumpa [expr $contentEnd + 1] {
                            set sourcemapSourcesCount [uint32]
                            debug {
                                move -4
                                entry "Sourcemap sources count" $sourcemapSourcesCount 4
                                move 4
                            }

                            move [expr 4 + 16 * $sourcemapSourcesCount]
                            ascii $sourcemapMappingsLength "Sourcemap mappings"

                            for {set j 0} {$j < $sourcemapSourcesCount} {incr j} {
                                jumpa [expr $contentEnd + 13 + $j * 8] {
                                    set sourceLength [uint32]
                                }
                                ascii $sourceLength "Sourcemap source"
                            }
                        }

                        incr dataOffset $sourcemapLength
                    }
                }

                move 4
            }
        }
    }
}
