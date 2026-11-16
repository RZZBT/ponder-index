// Rust standard library: the rest of Path and PathBuf. Results avoid printing separators that std inserts.
const { group } = require('./kit.cjs');
const PATH = ['std', 'Path', /^src\/path\.rs$/];
const PB = ['std', 'PathBuf', /^src\/path\.rs$/];
const FREE = ['std', '', /^src\/path\.rs$/];
const { list, add } = group({ at: PATH });
const P = 'std::path::Path';
const B = 'std::path::PathBuf';
const TMP = (n) => `let p = std::env::temp_dir().join("ponder_q14_${n}.txt"); let _ = std::fs::remove_file(&p); `;

// ---------------------------------------------------------------- Path: the file system

add('path/exists', 'exists', null, 'How Path::exists works', 'true if something exists at the path.', {
  rows: [['existing file', 'missing file']], call: 'path.exists()', note: 'errors count as false', outs: ['true', 'false'],
  intro: 'Permission problems also give false; try_exists reports them.',
  steps: [['The file is there: true.', 0, 'o0'], ['Missing: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Checking first and opening later can race.',
}, TMP('ex') + 'std::fs::write(&p, "").unwrap(); let a = p.exists(); std::fs::remove_file(&p).unwrap(); format!("{}, {}", a, p.exists())');

add('path/try_exists', 'try_exists', null, 'How Path::try_exists works', 'Whether the path exists, reporting errors instead of hiding them.', {
  rows: [['existing', 'missing']], call: 'path.try_exists()?', note: 'Ok(true), Ok(false) or Err', outs: ['Ok(true)', 'Ok(false)'],
  intro: 'Err means it could not be determined (e.g. permission denied).',
  steps: [['There: Ok(true).', 0, 'o0'], ['Missing: Ok(false).', 1, 'o1']],
  result: 'Ok(true), Ok(false)', resultCap: 'Same as fs::exists.',
}, TMP('tex') + 'std::fs::write(&p, "").unwrap(); let a = p.try_exists().map_err(|_| ()); std::fs::remove_file(&p).unwrap(); format!("{:?}, {:?}", a, p.try_exists().map_err(|_| ()))');

add('path/is_file', 'is_file', null, 'How Path::is_file works', 'true if the path points to a regular file.', {
  rows: [['a file', 'a folder']], call: 'path.is_file()', note: 'false on errors', outs: ['true', 'false'],
  intro: 'Follows symlinks.',
  steps: [['File: true.', 0, 'o0'], ['Folder: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Short for fs::metadata(p).map(|m| m.is_file()).unwrap_or(false).',
}, TMP('isf') + 'std::fs::write(&p, "").unwrap(); let a = p.is_file(); let b = std::env::temp_dir().is_file(); std::fs::remove_file(&p).unwrap(); format!("{}, {}", a, b)');

add('path/is_dir', 'is_dir', null, 'How Path::is_dir works', 'true if the path points to a folder.', {
  rows: [['temp folder', 'missing']], call: 'path.is_dir()', note: 'false on errors', outs: ['true', 'false'],
  intro: 'A missing path is not a folder.',
  steps: [['The temp folder: true.', 0, 'o0'], ['Missing: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Use before read_dir.',
}, `format!("{}, {}", std::env::temp_dir().is_dir(), ${P}::new("ponder_surely_missing_dir").is_dir())`);

add('path/is_symlink', 'is_symlink', null, 'How Path::is_symlink works', 'true if the path itself is a symbolic link.', {
  rows: [['regular file']], call: 'path.is_symlink()', note: 'not followed', outs: ['false'],
  intro: 'Uses symlink_metadata, so the link is not followed.',
  steps: [['A plain file.', 0], ['false.', [], 'o0']],
  result: 'false', resultCap: 'is_file and is_dir follow links instead.',
}, TMP('isl') + 'std::fs::write(&p, "").unwrap(); let r = p.is_symlink(); std::fs::remove_file(&p).unwrap(); r.to_string()');

add('path/metadata', 'metadata', null, 'How Path::metadata works', 'File information for the path (same as fs::metadata).', {
  rows: [['3-byte file']], call: 'path.metadata()?.len()', note: 'method form', outs: ['3'],
  intro: 'Reads nicer in chains.',
  steps: [['Ask the file system.', 0], ['Size 3.', [], 'o0']],
  result: '3', resultCap: 'symlink_metadata does not follow links.',
}, TMP('md') + 'std::fs::write(&p, "abc").unwrap(); let n = p.metadata().unwrap().len(); std::fs::remove_file(&p).unwrap(); n.to_string()');

add('path/symlink_metadata', 'symlink_metadata', null, 'How Path::symlink_metadata works', 'Information about the path itself, without following a link.', {
  rows: [['a file']], call: 'path.symlink_metadata()?', note: 'method form', outs: ['is_file: true'],
  intro: 'For regular files it is the same as metadata().',
  steps: [['Read the entry.', 0], ['It is a regular file.', [], 'o0']],
  result: 'true', resultCap: 'Use it to detect symlinks.',
}, TMP('sm') + 'std::fs::write(&p, "").unwrap(); let r = p.symlink_metadata().unwrap().is_file(); std::fs::remove_file(&p).unwrap(); r.to_string()');

add('path/canonicalize', 'canonicalize', null, 'How Path::canonicalize works', 'The absolute, resolved path (same as fs::canonicalize).', {
  rows: [['"dir/./f"']], call: 'path.canonicalize()?', note: 'resolve . and ..', outs: ['absolute path'],
  intro: 'The path must exist.',
  steps: [['Resolve the path.', 0], ['It becomes absolute.', [], 'o0']],
  result: 'absolute: true', resultCap: 'std::path::absolute works without touching the disk.',
}, TMP('cn') + 'std::fs::write(&p, "").unwrap(); let c = p.canonicalize().unwrap(); std::fs::remove_file(&p).unwrap(); format!("absolute: {}", c.is_absolute())');

add('path/read_dir', 'read_dir', null, 'How Path::read_dir works', 'Lists a folder\'s entries (same as fs::read_dir).', {
  rows: [['folder with 2 files']], call: 'dir.read_dir()?.count()', note: 'method form', outs: ['2'],
  intro: 'Each item is an io::Result<DirEntry>.',
  steps: [['The folder is opened.', 0], ['Two entries.', [], 'o0']],
  result: '2', resultCap: 'Order is not guaranteed.',
}, 'let dir = std::env::temp_dir().join("ponder_q14_rd"); let _ = std::fs::remove_dir_all(&dir); std::fs::create_dir(&dir).unwrap(); std::fs::write(dir.join("a"), "").unwrap(); std::fs::write(dir.join("b"), "").unwrap(); let n = dir.read_dir().unwrap().count(); std::fs::remove_dir_all(&dir).unwrap(); n.to_string()');

add('path/read_link', 'read_link', null, 'How Path::read_link works', 'The target of a symbolic link (same as fs::read_link).', {
  rows: [['a regular file']], call: 'path.read_link()', note: 'only for links', outs: ['Err'],
  intro: 'A plain file is not a link.',
  steps: [['Not a symlink.', 0], ['Err.', [], 'o0']],
  result: 'Err', resultCap: 'On a real link it returns its stored target.',
}, TMP('rl') + 'std::fs::write(&p, "").unwrap(); let r = p.read_link().is_err(); std::fs::remove_file(&p).unwrap(); (if r { "Err" } else { "Ok" }).to_string()');

// ---------------------------------------------------------------- Path: pure path handling

add('path/is_absolute', 'is_absolute', null, 'How Path::is_absolute works', 'true if the path does not depend on the current folder.', {
  rows: [['temp_dir()', '"notes.txt"']], call: 'path.is_absolute()', note: 'platform rules', outs: ['true', 'false'],
  intro: 'On Windows an absolute path needs a drive or UNC prefix; on Unix a leading /.',
  steps: [['temp_dir() is absolute.', 0, 'o0'], ['"notes.txt" is relative.', 1, 'o1']],
  result: 'true, false', resultCap: 'is_relative is the opposite.',
}, `format!("{}, {}", std::env::temp_dir().is_absolute(), ${P}::new("notes.txt").is_absolute())`);

add('path/iter', 'iter', null, 'How Path::iter works', 'The components of the path as &OsStr.', {
  rows: [['"a/b/c.txt"']], call: 'path.iter()', note: 'like components', outs: ['"a"', '"b"', '"c.txt"'],
  intro: 'Simpler than components() when you only need the names.',
  steps: [['Split at separators.', 0], ['Three parts.', [], 'o0']],
  result: '["a", "b", "c.txt"]', resultCap: 'Leading / or a drive prefix also appear as items.',
}, `d(${P}::new("a/b/c.txt").iter().map(|s| s.to_string_lossy().into_owned()).collect::<Vec<_>>())`);

add('path/as_os_str', 'as_os_str', null, 'How Path::as_os_str works', 'The path as an &OsStr, without copying.', {
  rows: [['Path "x.rs"']], call: 'path.as_os_str()', note: 'Path is a thin wrapper', outs: ['OsStr "x.rs"'],
  intro: 'Useful for APIs that take OsStr.',
  steps: [['Same bytes.', 0], ['Seen as OsStr.', [], 'o0']],
  result: '"x.rs"', resultCap: 'Path::new goes the other way.',
}, `d(${P}::new("x.rs").as_os_str())`);

add('path/into_path_buf', 'into_path_buf', null, 'How Path::into_path_buf works', 'Turns a Box<Path> into a PathBuf without copying.', {
  rows: [['Box<Path> "p"']], call: 'boxed.into_path_buf()', note: 'growable again', outs: ['PathBuf "p"'],
  intro: 'Box<Path> cannot grow; PathBuf can.',
  steps: [['The box is handed over.', 0], ['Now a PathBuf.', [], 'o0']],
  result: '"p"', resultCap: 'PathBuf::into_boxed_path goes back.',
}, `let b: Box<${P}> = ${B}::from("p").into_boxed_path(); d(b.into_path_buf())`);

add('path/with_file_name', 'with_file_name', null, 'How Path::with_file_name works', 'A new PathBuf with the last part replaced.', {
  rows: [['"logs/old.txt"']], call: 'path.with_file_name("new.txt")', note: 'same folder, new name', outs: ['logs/new.txt'],
  intro: 'The folder part is kept.',
  steps: [['"old.txt" is dropped.', 0], ['"new.txt" takes its place.', [], 'o0']],
  result: 'Some("new.txt"), parent Some("logs")', resultCap: 'with_extension changes only the extension.',
}, `let n = ${P}::new("logs/old.txt").with_file_name("new.txt"); format!("{:?}, parent {:?}", n.file_name(), n.parent())`);

add('path/file_prefix', 'file_prefix', null, 'How Path::file_prefix works', 'The file name up to the first dot.', {
  rows: [['"archive.tar.gz"']], call: 'path.file_prefix()', note: 'vs file_stem', outs: ['Some("archive")'],
  intro: 'file_stem removes only the last extension ("archive.tar").',
  steps: [['The name is "archive.tar.gz".', 0], ['Up to the first dot: "archive".', [], 'o0']],
  result: 'Some("archive")', resultCap: 'Leading dots (".bashrc") are kept as part of the name.',
}, `d(${P}::new("archive.tar.gz").file_prefix())`);

add('path/with_added_extension', 'with_added_extension', null, 'How Path::with_added_extension works', 'A new PathBuf with an extra extension appended.', {
  rows: [['"data.tar"']], call: 'path.with_added_extension("gz")', note: 'add, not replace', outs: ['"data.tar.gz"'],
  intro: 'with_extension would replace .tar instead.',
  steps: [['Keep ".tar".', 0], ['Add ".gz".', [], 'o0']],
  result: '"data.tar.gz"', resultCap: 'PathBuf::add_extension does it in place.',
}, `d(${P}::new("data.tar").with_added_extension("gz"))`);

add('path/absolute', 'absolute', FREE, 'How path::absolute works', 'Makes a path absolute using the current folder, without touching the disk.', {
  rows: [['"notes.txt"']], call: 'std::path::absolute("notes.txt")?', note: 'no existence check', outs: ['current_dir/notes.txt'],
  intro: 'Unlike canonicalize, the file need not exist and symlinks are not resolved.',
  steps: [['Take the current folder.', 0], ['Join the relative path.', [], 'o0']],
  result: 'absolute: true', resultCap: 'Does not remove ".." on Unix.',
}, 'format!("absolute: {}", std::path::absolute("notes.txt").unwrap().is_absolute())');

add('path/is_separator', 'is_separator', FREE, 'How path::is_separator works', 'true if a char separates path components on this OS.', {
  rows: [["'/'", "'a'"]], call: "std::path::is_separator(c)", note: '/ everywhere, \\ on Windows', outs: ['true', 'false'],
  intro: 'Windows accepts both / and \\.',
  steps: [["'/' is a separator.", 0, 'o0'], ["'a' is not.", 1, 'o1']],
  result: 'true, false', resultCap: 'std::path::MAIN_SEPARATOR is the preferred one.',
}, 'format!("{}, {}", std::path::is_separator(\'/\'), std::path::is_separator(\'a\'))');

add('components/as_path', 'as_path', ['std', 'Components', /^src\/path\.rs$/], 'How Components::as_path works', 'The remaining part of the path not yet visited.', {
  rows: [['"a/b/c"']], call: 'let mut c = p.components(); c.next(); c.as_path()', note: 'what is left', outs: ['"b/c"'],
  intro: 'Borrowed from the original path.',
  steps: [['"a" was visited.', 0], ['"b/c" remains.', [], 'o0']],
  result: '"b/c"', resultCap: 'Iter::as_path does the same for path.iter().',
}, `let p = ${P}::new("a/b/c"); let mut c = p.components(); c.next(); d(c.as_path())`);

add('path_iter/as_path', 'as_path', ['std', 'Iter', /^src\/path\.rs$/], 'How path::Iter::as_path works', 'The remaining part of the path from path.iter().', {
  rows: [['"x/y/z"']], call: 'let mut it = p.iter(); it.next_back(); it.as_path()', note: 'what is left', outs: ['"x/y"'],
  intro: 'Works from either end.',
  steps: [['"z" was taken from the back.', 0], ['"x/y" remains.', [], 'o0']],
  result: '"x/y"', resultCap: 'Same as Components::as_path.',
}, `let p = ${P}::new("x/y/z"); let mut it = p.iter(); it.next_back(); d(it.as_path())`);

add('component/as_os_str', 'as_os_str', ['std', 'Component', /^src\/path\.rs$/], 'How Component::as_os_str works', 'One path component as an &OsStr.', {
  rows: [['Normal("src")']], call: 'comp.as_os_str()', note: 'the text of one part', outs: ['"src"'],
  intro: 'Works for every kind: Normal, RootDir, CurDir, ParentDir, Prefix.',
  steps: [['The first component of "src/main.rs".', 0], ['Its text: "src".', [], 'o0']],
  result: '"src"', resultCap: '".." gives ParentDir, whose text is "..".',
}, `d(${P}::new("src/main.rs").components().next().unwrap().as_os_str())`);

// ---------------------------------------------------------------- PathBuf

add('pathbuf/new', 'new', PB, 'How PathBuf::new works', 'An empty, growable path.', {
  rows: [['PathBuf::new()']], call: 'let mut p = PathBuf::new(); p.push("a"); p.push("b");', note: 'build step by step', outs: ['a/b'],
  intro: 'push adds components with the OS separator.',
  steps: [['Empty.', 0], ['After two pushes: a, b.', [], 'o0']],
  result: '["a", "b"]', resultCap: 'PathBuf::from("a/b") is shorter for fixed paths.',
}, `let mut p = ${B}::new(); p.push("a"); p.push("b"); d(p.iter().map(|s| s.to_string_lossy().into_owned()).collect::<Vec<_>>())`);

add('pathbuf/with_capacity', 'with_capacity', PB, 'How PathBuf::with_capacity works', 'An empty PathBuf with room for n bytes.', {
  rows: [['256']], call: 'PathBuf::with_capacity(256)', note: 'pre-allocate', outs: ['capacity ≥ 256'],
  intro: 'Avoids reallocations while pushing many parts.',
  steps: [['Room for 256 bytes.', 0], ['Still empty.', [], 'o0']],
  result: 'true', resultCap: 'Same idea as String::with_capacity.',
}, `(${B}::with_capacity(256).capacity() >= 256).to_string()`);

add('pathbuf/capacity', 'capacity', PB, 'How PathBuf::capacity works', 'How many bytes fit before the PathBuf must grow.', {
  rows: [['with_capacity(64)']], call: 'p.capacity()', note: 'room', outs: ['≥ 64'],
  intro: 'Like String::capacity.',
  steps: [['Room was reserved.', 0], ['At least 64.', [], 'o0']],
  result: 'true', resultCap: 'shrink_to_fit releases spare room.',
}, `(${B}::with_capacity(64).capacity() >= 64).to_string()`);

add('pathbuf/clear', 'clear', PB, 'How PathBuf::clear works', 'Empties the path, keeping its capacity.', {
  rows: [['"a/b"']], call: 'p.clear()', note: 'reuse the buffer', outs: ['""'],
  intro: 'Handy when building many paths in a loop.',
  steps: [['The text is removed.', 0], ['An empty path remains.', [], 'o0']],
  result: '""', resultCap: 'The allocation is kept.',
}, `let mut p = ${B}::from("a/b"); p.clear(); d(p)`);

add('pathbuf/as_path', 'as_path', PB, 'How PathBuf::as_path works', 'Borrows the PathBuf as a &Path.', {
  rows: [['PathBuf "x/y"']], call: 'takes_path(pb.as_path())', note: 'PathBuf → &Path', outs: ['&Path "x/y"'],
  intro: 'Functions should take &Path (or impl AsRef<Path>).',
  steps: [['The PathBuf is borrowed.', 0], ['As a &Path.', [], 'o0']],
  result: '"x/y"', resultCap: '&pb works too through Deref.',
}, `let p = ${B}::from("x/y"); d(p.as_path())`);

add('pathbuf/into_os_string', 'into_os_string', PB, 'How PathBuf::into_os_string works', 'Turns the PathBuf into an OsString without copying.', {
  rows: [['PathBuf "f.txt"']], call: 'pb.into_os_string()', note: 'same bytes', outs: ['OsString "f.txt"'],
  intro: 'Then into_string() can try to make a String.',
  steps: [['The PathBuf is consumed.', 0], ['An OsString remains.', [], 'o0']],
  result: '"f.txt"', resultCap: 'PathBuf::from(os_string) goes back.',
}, `d(${B}::from("f.txt").into_os_string())`);

add('pathbuf/into_boxed_path', 'into_boxed_path', PB, 'How PathBuf::into_boxed_path works', 'Turns the PathBuf into a Box<Path>, dropping spare capacity.', {
  rows: [['PathBuf "cfg"']], call: 'pb.into_boxed_path()', note: 'fixed, smaller', outs: ['Box<Path> "cfg"'],
  intro: 'Good for storing many paths that never change.',
  steps: [['Spare room is released.', 0], ['A Box<Path>.', [], 'o0']],
  result: '"cfg"', resultCap: 'into_path_buf goes back.',
}, `d(${B}::from("cfg").into_boxed_path())`);

add('pathbuf/leak', 'leak', PB, 'How PathBuf::leak works', 'Gives up the PathBuf and returns a &\'static mut Path.', {
  rows: [['PathBuf "data"']], call: "let p: &'static Path = pb.leak();", note: 'never freed', outs: ["&'static Path"],
  intro: 'For paths computed once that must live for the whole program.',
  steps: [['The buffer is never freed.', 0], ['You get a static reference.', [], 'o0']],
  result: '"data"', resultCap: 'Do not call it repeatedly.',
}, `let p: &'static ${P} = ${B}::from("data").leak(); d(p)`);

add('pathbuf/add_extension', 'add_extension', PB, 'How PathBuf::add_extension works', 'Appends another extension in place.', {
  rows: [['"log.txt"']], call: 'p.add_extension("bak")', note: 'keep the old one', outs: ['"log.txt.bak"'],
  intro: 'set_extension would replace .txt.',
  steps: [['".txt" stays.', 0], ['".bak" is added.', [], 'o0']],
  result: '"log.txt.bak"', resultCap: 'Returns false if there is no file name.',
}, `let mut p = ${B}::from("log.txt"); p.add_extension("bak"); d(p)`);

add('pathbuf/as_mut_os_string', 'as_mut_os_string', PB, 'How PathBuf::as_mut_os_string works', 'Mutable access to the underlying OsString.', {
  rows: [['"name"']], call: 'p.as_mut_os_string().push("_v2")', note: 'edit as text', outs: ['"name_v2"'],
  intro: 'Appends text without adding a separator, unlike push.',
  steps: [['Get the OsString.', 0], ['Append "_v2".', [], 'o0']],
  result: '"name_v2"', resultCap: 'push("_v2") would add a separator first.',
}, `let mut p = ${B}::from("name"); p.as_mut_os_string().push("_v2"); d(p)`);

add('pathbuf/reserve', 'reserve', PB, 'How PathBuf::reserve works', 'Makes room for at least n more bytes.', {
  rows: [['empty PathBuf']], call: 'p.reserve(100)', note: 'grow ahead', outs: ['capacity ≥ 100'],
  intro: 'Like String::reserve.',
  steps: [['Request room.', 0], ['Capacity is at least 100.', [], 'o0']],
  result: 'true', resultCap: 'reserve_exact avoids extra headroom.',
}, `let mut p = ${B}::new(); p.reserve(100); (p.capacity() >= 100).to_string()`);

add('pathbuf/reserve_exact', 'reserve_exact', PB, 'How PathBuf::reserve_exact works', 'Makes room for exactly n more bytes.', {
  rows: [['empty PathBuf']], call: 'p.reserve_exact(10)', note: 'no headroom', outs: ['capacity ≥ 10'],
  intro: 'For a known final size.',
  steps: [['Request exactly 10.', 0], ['Capacity is at least 10.', [], 'o0']],
  result: 'true', resultCap: 'The allocator may round up.',
}, `let mut p = ${B}::new(); p.reserve_exact(10); (p.capacity() >= 10).to_string()`);

add('pathbuf/shrink_to_fit', 'shrink_to_fit', PB, 'How PathBuf::shrink_to_fit works', 'Releases unused capacity.', {
  rows: [['"a", capacity 100']], call: 'p.shrink_to_fit()', note: 'give memory back', outs: ['small capacity'],
  intro: 'Useful for long-lived paths.',
  steps: [['Most room is unused.', 0], ['Released.', [], 'o0']],
  result: 'true', resultCap: 'shrink_to keeps a minimum.',
}, `let mut p = ${B}::with_capacity(100); p.push("a"); p.shrink_to_fit(); (p.capacity() < 100).to_string()`);

add('pathbuf/shrink_to', 'shrink_to', PB, 'How PathBuf::shrink_to works', 'Reduces capacity, keeping a minimum.', {
  rows: [['"a", capacity 100']], call: 'p.shrink_to(16)', note: 'keep headroom', outs: ['16 ≤ capacity < 100'],
  intro: 'Like shrink_to_fit with a floor.',
  steps: [['Room shrinks...', 0], ['...but stays ≥ 16.', [], 'o0']],
  result: 'true', resultCap: 'Never below the length.',
}, `let mut p = ${B}::with_capacity(100); p.push("a"); p.shrink_to(16); (p.capacity() >= 16 && p.capacity() < 100).to_string()`);

add('pathbuf/try_reserve', 'try_reserve', PB, 'How PathBuf::try_reserve works', 'Reserves room, returning an error instead of aborting.', {
  rows: [['10', 'usize::MAX']], call: 'p.try_reserve(n)', note: 'recoverable', outs: ['Ok', 'Err'],
  intro: 'Impossible sizes become an Err.',
  steps: [['10: Ok.', 0, 'o0'], ['usize::MAX: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'try_reserve_exact avoids headroom.',
}, `let mut p = ${B}::new(); let a = p.try_reserve(10).is_ok(); let b = p.try_reserve(usize::MAX).is_ok(); format!("{}, {}", if a { "Ok" } else { "Err" }, if b { "Ok" } else { "Err" })`);

add('pathbuf/try_reserve_exact', 'try_reserve_exact', PB, 'How PathBuf::try_reserve_exact works', 'try_reserve without headroom.', {
  rows: [['8']], call: 'p.try_reserve_exact(8)', note: 'exact, recoverable', outs: ['Ok'],
  intro: 'Asks for just enough room.',
  steps: [['Room for 8.', 0], ['Ok.', [], 'o0']],
  result: 'Ok', resultCap: 'Same pattern as on String.',
}, `let mut p = ${B}::new(); (if p.try_reserve_exact(8).is_ok() { "Ok" } else { "Err" }).to_string()`);

module.exports = list;
