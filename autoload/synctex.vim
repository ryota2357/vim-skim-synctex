function! synctex#start() abort
    call denops#notify('synctex', 'start', [])
endfunction

function! synctex#stop() abort
    call denops#notify('synctex', 'stop', [])
endfunction

function! synctex#option(key, value) abort
    if a:key ==# 'pdfFile'
        let l:id = denops#callback#register(a:value)
        call denops#notify('synctex', 'option', [a:key, l:id])
    else
        call denops#notify('synctex', 'option', [a:key, a:value])
    endif
endfunction

function! synctex#forwardSerch() abort
    call denops#notify('synctex', 'forwardSearch', [])
endfunction
