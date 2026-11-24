# tree-sitter-aethel

Tree-sitter grammar and Neovim queries (`highlights`, `folds`, `indents`, `locals`, `textobjects`, `injections`) for the [Aethel](https://github.com/AleryBerry/aethel-lang) programming language.

## Language Coverage

- Modules & imports (`import std/vec as vec`, `import a/b.{c}`)
- Arbitrary-width integers (`u1..u65535`, `i1..i65535`) and refined interval types (`Int(lo..=hi)`)
- Algebraic data types, records, `@layout(...)` attributes, `@external(rust, ...)`, and `extern "rust"` blocks
- Affine path borrows (`~>.{x, y}`), `view` / `fork` / `join`, and saturating/wrapping arithmetic (`+|`, `-|`, `*|`, `+%`, `-%`, `*%`)
- Categorical traits & instances (`trait`, `<=`, HKT parameters `f(_)`, `default instance`, `with`, postfix `using`)
- Constitutional laws & termination (`law`, `preserves`, `when`, `always`, `never`, `decreases`)
- Dynamic standard library containers (`Vec`, `Map`, `Set`, `Deque`, `Option`, `Result`) and string escape sequences

## Neovim Installation

Run `./install.sh` to generate/compile `aethel.so` into `~/.local/share/nvim/site/parser/` and install the `.scm` queries into `~/.config/nvim/queries/aethel/` and `~/.local/share/nvim/site/queries/aethel/`.
