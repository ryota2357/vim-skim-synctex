command! -buffer SynctexStart call denops#notify('synctex', 'start', [])
command! -buffer SynctexStop call denops#notify('synctex', 'stop', [])
command! -buffer SynctexToggle call denops#notify('synctex', 'toggle', [])
