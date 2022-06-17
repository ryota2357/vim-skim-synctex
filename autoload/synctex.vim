function! synctex#start() abort
  call s:notify('start', [])
endfunction

function! synctex#stop() abort
  call s:notify('stop', [])
endfunction

function! synctex#forwardSerch() abort
  call s:notify('forwardSearch', [])
endfunction

function! synctex#status() abort
  return s:is_running()
        \ ? denops#request('synctex', 'status', [])
        \ : {'status': 'denops server is stopped'}
endfunction

function! synctex#option(key, value) abort
  if a:key ==# 'pdfFile'
    if s:is_running()
      call denops#notify('synctex', 'option', [a:key, denops#callback#register(a:value)])
    else
      let s:func = a:value
      autocmd User DenopsPluginPost:synctex call s:pdfFile()
    endif
  else
    call s:notify('option', [a:key, a:value])
  endif
endfunction

function! s:pdfFile() abort
  let l:id = denops#callback#register(s:func)
  call denops#notify('synctex', 'option', ['pdfFile', l:id])
endfunction

function! s:notify(method, args) abort
  if s:is_running()
    call denops#notify('synctex', a:method, a:args)
  else
    execute printf('autocmd User DenopsPluginPost:synctex call ' .
          \ 'denops#notify("synctex", "%s", %s)',
          \ a:method, string(a:args))
  endif
endfunction

function! s:is_running() abort
  return exists('g:loaded_denops')
        \ && denops#server#status() ==# 'running'
        \ && denops#plugin#is_loaded('synctex')
endfunction
