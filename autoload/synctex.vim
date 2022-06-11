function! synctex#start() abort
    call denops#notify('synctex', 'start', [])
endfunction

function! synctex#stop() abort
    call denops#notify('synctex', 'stop', [])
endfunction

function! synctex#forwardSerch() abort
    call denops#notify('synctex', 'forwardSearch', [])
endfunction
