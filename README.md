# vim-skim-synctex

This plugin enables you to do synctex (forward serch and backward serch) with [Skim.app](https://skim-app.sourceforge.io/) in macOS.

Please read [help](doc/synctex.txt) for details.

## install

For dein.vim

```vim
call dein#begin()

call dein#add('ryota2357/vim-skim-synctex')
call dein#add('vim-denops/denops.vim')

call dein#end()
```

### Requirements

vim-skim-synctex requires both Deno and denops.vim.

- [https://deno.land/](https://deno.land/)
- [https://github.com/vim-denops/denops.vim](https://github.com/vim-denops/denops.vim)

## Skim setting

Skim settings are required.

Skim > Prefarence > Sync > PDF-TeX Sync support

- Preset: `Custom`
- Command: `curl`
- Arguments: `localhost:8080 -XPUT -d localhost:8080 -XPUT -d "%line %file"`

![skimの設定](https://github.com/ryota2357/vim-skim-synctex/blob/images/skim-setting.png)

If you set option `hostname` or `port` in `synctex#option()`, you should fix this settings.

## Example

```vim
call synctex#option('readingBar', v:true)

" fix skim setting(Prefarence > Sync > PDF-Tex Sync support > Arguments)
"   localhost:6000 -XPUT -d "%line %file"
call synctex#option('port', 6000)

autocmd FileType tex call s:TexKeymap()

function! s:TexKeymap() abort
  nnoremap <buffer> <Space>s <Cmd>call synctex#forwardSerch()<CR>
  command! -buffer SynctexStart :call synctex#start()
  command! -buffer SynctexStop :call synctex#stop()
endfunction
```
