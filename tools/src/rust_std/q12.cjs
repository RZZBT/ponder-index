// Rust standard library: the rest of std::fs (DirBuilder, DirEntry, FileType, Metadata, Permissions, OpenOptions,
// file locks and syncing, links, directories). Truth checks use their own files in the temp folder and remove them.
const { group } = require('./kit.cjs');
const FS = (o) => ['std', o, /^src\/fs\.rs$/];
const { list, add } = group({ at: FS('') });
const TMP = (n) => `let p = std::env::temp_dir().join("ponder_q12_${n}.txt"); let _ = std::fs::remove_file(&p); `;
const DIR = (n) => `let dir = std::env::temp_dir().join("ponder_q12_${n}"); let _ = std::fs::remove_dir_all(&dir); `;
const IO = 'use std::io::{Read, Write}; ';

// ---------------------------------------------------------------- directories

add('fs/create_dir', 'create_dir', null, 'How fs::create_dir works', 'Creates one new folder; the parent must exist.', {
  rows: [['new folder', 'already exists']], call: 'fs::create_dir("out")', note: 'not recursive', outs: ['Ok(())', 'Err(AlreadyExists)'],
  intro: 'create_dir_all creates missing parents too.',
  steps: [['First time: created.', 0, 'o0'], ['Again: AlreadyExists.', 1, 'o1']],
  result: 'Ok(()), Err(AlreadyExists)', resultCap: 'Missing parent folders give NotFound.',
}, DIR('mk') + 'let a = std::fs::create_dir(&dir).map_err(|e| e.kind()); let b = std::fs::create_dir(&dir).map_err(|e| e.kind()); std::fs::remove_dir(&dir).unwrap(); format!("{:?}, {:?}", a, b)');

add('fs/remove_dir', 'remove_dir', null, 'How fs::remove_dir works', 'Removes an empty folder.', {
  rows: [['empty folder', 'folder with a file']], call: 'fs::remove_dir(dir)', note: 'must be empty', outs: ['Ok(())', 'Err'],
  intro: 'Refuses to delete a folder that still has contents.',
  steps: [['Empty: removed.', 0, 'o0'], ['Not empty: error.', 1, 'o1']],
  result: 'Err, Ok(())', resultCap: 'remove_dir_all deletes contents too.',
}, DIR('rmd') + 'std::fs::create_dir(&dir).unwrap(); std::fs::write(dir.join("f"), "").unwrap(); let a = if std::fs::remove_dir(&dir).is_err() { "Err" } else { "Ok" }; std::fs::remove_file(dir.join("f")).unwrap(); let b = std::fs::remove_dir(&dir).map_err(|_| ()); format!("{}, {:?}", a, b)');

add('fs/remove_dir_all', 'remove_dir_all', null, 'How fs::remove_dir_all works', 'Deletes a folder and everything inside it.', {
  rows: [['dir/a.txt', 'dir/sub/b.txt']], call: 'fs::remove_dir_all("build")?', note: 'like rm -rf: careful!', outs: ['all gone'],
  intro: 'No recycle bin: everything is deleted for good.',
  steps: [['Files and subfolders are removed.', [0, 1]], ['Then the folder itself.', [], 'o0']],
  result: 'exists: false', resultCap: 'Double-check the path before calling it.',
}, DIR('rmall') + 'std::fs::create_dir_all(dir.join("sub")).unwrap(); std::fs::write(dir.join("a.txt"), "").unwrap(); std::fs::write(dir.join("sub").join("b.txt"), "").unwrap(); std::fs::remove_dir_all(&dir).unwrap(); format!("exists: {}", dir.exists())');

add('fs/canonicalize', 'canonicalize', null, 'How fs::canonicalize works', 'The absolute path with . and .. resolved and symlinks followed.', {
  rows: [['"dir/./sub/../file"']], call: 'fs::canonicalize("dir/./sub/../file")?', note: 'the real path', outs: ['/full/path/dir/file'],
  intro: 'The file must exist.',
  steps: [['. and .. are resolved.', 0], ['An absolute path results.', [], 'o0']],
  result: 'same file: true', resultCap: 'std::path::absolute does not touch the disk.',
}, DIR('canon') + 'std::fs::create_dir_all(dir.join("sub")).unwrap(); std::fs::write(dir.join("file"), "").unwrap(); let a = std::fs::canonicalize(dir.join(".").join("sub").join("..").join("file")).unwrap(); let b = std::fs::canonicalize(dir.join("file")).unwrap(); std::fs::remove_dir_all(&dir).unwrap(); format!("same file: {}", a == b)');

add('dir_builder/new', 'new', FS('DirBuilder'), 'How DirBuilder::new works', 'Starts configuring how folders are created.', {
  rows: [['DirBuilder::new()']], call: 'DirBuilder::new().recursive(true).create("a/b/c")?', note: 'options, then create', outs: ['folders created'],
  intro: 'A builder for create_dir with options.',
  steps: [['Default settings.', 0], ['create() makes the folder.', [], 'o0']],
  result: 'true', resultCap: 'On Unix you can also set the permission mode.',
}, DIR('db') + 'std::fs::DirBuilder::new().create(&dir).unwrap(); let ok = dir.is_dir(); std::fs::remove_dir(&dir).unwrap(); ok.to_string()');

add('dir_builder/recursive', 'recursive', FS('DirBuilder'), 'How DirBuilder::recursive works', 'Makes create() also create missing parent folders.', {
  rows: [['a/b/c']], call: 'DirBuilder::new().recursive(true).create(path)', note: 'like create_dir_all', outs: ['a, a/b, a/b/c'],
  intro: 'No error if the folder already exists.',
  steps: [['Missing parents are created.', 0], ['The full path exists.', [], 'o0']],
  result: 'true', resultCap: 'Without it, a missing parent gives NotFound.',
}, DIR('dbr') + 'let p = dir.join("b").join("c"); std::fs::DirBuilder::new().recursive(true).create(&p).unwrap(); let ok = p.is_dir(); std::fs::remove_dir_all(&dir).unwrap(); ok.to_string()');

add('dir_builder/create', 'create', FS('DirBuilder'), 'How DirBuilder::create works', 'Creates the folder with the builder\'s settings.', {
  rows: [['existing folder, recursive']], call: 'builder.create(path)', note: 'the final step', outs: ['Ok(())'],
  intro: 'With recursive(true), an existing folder is fine.',
  steps: [['The folder already exists.', 0], ['Still Ok.', [], 'o0']],
  result: 'Ok(())', resultCap: 'Without recursive it would be AlreadyExists.',
}, DIR('dbc') + 'std::fs::create_dir(&dir).unwrap(); let r = std::fs::DirBuilder::new().recursive(true).create(&dir).map_err(|_| ()); std::fs::remove_dir(&dir).unwrap(); d(r)');

add('dir_entry/path', 'path', FS('DirEntry'), 'How DirEntry::path works', 'The full path of an entry found by read_dir.', {
  rows: [['entry "a.txt" in dir']], call: 'entry.path()', note: 'dir joined with the name', outs: ['dir/a.txt'],
  intro: 'Ready to open or inspect.',
  steps: [['read_dir yields the entry.', 0], ['path() joins folder and name.', [], 'o0']],
  result: 'ends with a.txt: true', resultCap: 'file_name() gives just the name.',
}, DIR('dep') + 'std::fs::create_dir(&dir).unwrap(); std::fs::write(dir.join("a.txt"), "").unwrap(); let e = std::fs::read_dir(&dir).unwrap().next().unwrap().unwrap(); let ok = e.path().ends_with("a.txt"); std::fs::remove_dir_all(&dir).unwrap(); format!("ends with a.txt: {}", ok)');

add('dir_entry/file_name', 'file_name', FS('DirEntry'), 'How DirEntry::file_name works', 'Just the name of the entry, as an OsString.', {
  rows: [['entry in dir']], call: 'entry.file_name()', note: 'no folder part', outs: ['"notes.md"'],
  intro: 'Convert with to_string_lossy() for printing.',
  steps: [['The entry was found.', 0], ['Its name.', [], 'o0']],
  result: '"notes.md"', resultCap: 'path() includes the folder.',
}, DIR('den') + 'std::fs::create_dir(&dir).unwrap(); std::fs::write(dir.join("notes.md"), "").unwrap(); let e = std::fs::read_dir(&dir).unwrap().next().unwrap().unwrap(); let n = e.file_name().to_string_lossy().into_owned(); std::fs::remove_dir_all(&dir).unwrap(); d(n)');

add('dir_entry/file_type', 'file_type', FS('DirEntry'), 'How DirEntry::file_type works', 'Whether the entry is a file, folder or symlink.', {
  rows: [['sub/', 'f.txt']], call: 'entry.file_type()?.is_dir()', note: 'often free (no extra disk call)', outs: ['dir: true', 'file: false'],
  intro: 'Many systems report the type while listing.',
  steps: [['"sub" is a folder.', 0, 'o0'], ['"f.txt" is a file.', 1, 'o1']],
  result: '[("f.txt", false), ("sub", true)]', resultCap: 'Use it to recurse only into folders.',
}, DIR('det') + 'std::fs::create_dir_all(dir.join("sub")).unwrap(); std::fs::write(dir.join("f.txt"), "").unwrap(); let mut v: Vec<(String, bool)> = std::fs::read_dir(&dir).unwrap().map(|e| { let e = e.unwrap(); (e.file_name().to_string_lossy().into_owned(), e.file_type().unwrap().is_dir()) }).collect(); v.sort(); std::fs::remove_dir_all(&dir).unwrap(); d(v)');

add('dir_entry/metadata', 'metadata', FS('DirEntry'), 'How DirEntry::metadata works', 'Size, type and times of an entry.', {
  rows: [['file with 3 bytes']], call: 'entry.metadata()?.len()', note: 'info while listing', outs: ['3'],
  intro: 'Saves building the path and calling fs::metadata.',
  steps: [['The entry is a 3-byte file.', 0], ['len() is 3.', [], 'o0']],
  result: '3', resultCap: 'Does not follow symlinks on some platforms.',
}, DIR('dem') + 'std::fs::create_dir(&dir).unwrap(); std::fs::write(dir.join("f"), "abc").unwrap(); let e = std::fs::read_dir(&dir).unwrap().next().unwrap().unwrap(); let n = e.metadata().unwrap().len(); std::fs::remove_dir_all(&dir).unwrap(); n.to_string()');

// ---------------------------------------------------------------- Metadata, FileType, Permissions

add('metadata/len', 'len', FS('Metadata'), 'How Metadata::len works', 'The size of the file in bytes.', {
  rows: [['"hello"']], call: 'fs::metadata(p)?.len()', note: 'bytes', outs: ['5'],
  intro: 'For folders the value is system-specific.',
  steps: [['The file has 5 bytes.', 0], ['len() is 5.', [], 'o0']],
  result: '5', resultCap: 'Check sizes before reading huge files.',
}, TMP('len') + 'std::fs::write(&p, "hello").unwrap(); let n = std::fs::metadata(&p).unwrap().len(); std::fs::remove_file(&p).unwrap(); n.to_string()');

add('metadata/is_file', 'is_file', FS('Metadata'), 'How Metadata::is_file works', 'true for regular files.', {
  rows: [['a file', 'a folder']], call: 'meta.is_file()', note: 'not a folder', outs: ['true', 'false'],
  intro: 'Symlinks are followed by fs::metadata.',
  steps: [['File: true.', 0, 'o0'], ['Folder: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Path::is_file is a shortcut.',
}, TMP('isf') + 'std::fs::write(&p, "").unwrap(); let a = std::fs::metadata(&p).unwrap().is_file(); let b = std::fs::metadata(std::env::temp_dir()).unwrap().is_file(); std::fs::remove_file(&p).unwrap(); format!("{}, {}", a, b)');

add('metadata/is_dir', 'is_dir', FS('Metadata'), 'How Metadata::is_dir works', 'true for folders.', {
  rows: [['temp folder', 'a file']], call: 'meta.is_dir()', note: 'a directory?', outs: ['true', 'false'],
  intro: 'The opposite of is_file for normal entries.',
  steps: [['Folder: true.', 0, 'o0'], ['File: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Path::is_dir is a shortcut.',
}, TMP('isd') + 'std::fs::write(&p, "").unwrap(); let a = std::fs::metadata(std::env::temp_dir()).unwrap().is_dir(); let b = std::fs::metadata(&p).unwrap().is_dir(); std::fs::remove_file(&p).unwrap(); format!("{}, {}", a, b)');

add('metadata/is_symlink', 'is_symlink', FS('Metadata'), 'How Metadata::is_symlink works', 'true for symbolic links (use symlink_metadata to see them).', {
  rows: [['a regular file']], call: 'fs::symlink_metadata(p)?.is_symlink()', note: 'not followed', outs: ['false'],
  intro: 'fs::metadata follows links, so it never reports one.',
  steps: [['A plain file.', 0], ['Not a symlink.', [], 'o0']],
  result: 'false', resultCap: 'Creating symlinks needs extra rights on Windows.',
}, TMP('isl') + 'std::fs::write(&p, "").unwrap(); let r = std::fs::symlink_metadata(&p).unwrap().is_symlink(); std::fs::remove_file(&p).unwrap(); r.to_string()');

add('metadata/file_type', 'file_type', FS('Metadata'), 'How Metadata::file_type works', 'The kind of entry: file, folder or symlink.', {
  rows: [['a file']], call: 'meta.file_type()', note: 'FileType', outs: ['is_file: true'],
  intro: 'FileType has is_file, is_dir and is_symlink.',
  steps: [['Get the metadata.', 0], ['Ask its type.', [], 'o0']],
  result: 'file: true, dir: false', resultCap: 'Same information as the is_* shortcuts.',
}, TMP('ft') + 'std::fs::write(&p, "").unwrap(); let t = std::fs::metadata(&p).unwrap().file_type(); let r = format!("file: {}, dir: {}", t.is_file(), t.is_dir()); std::fs::remove_file(&p).unwrap(); r');

add('metadata/modified', 'modified', FS('Metadata'), 'How Metadata::modified works', 'When the file was last changed.', {
  rows: [['just written']], call: 'meta.modified()?', note: 'a SystemTime', outs: ['a few ms ago'],
  intro: 'Build tools compare these times to decide what to rebuild.',
  steps: [['The file was just written.', 0], ['Its time is recent.', [], 'o0']],
  result: 'recent: true', resultCap: 'Not every file system records it precisely.',
}, TMP('mod') + 'std::fs::write(&p, "x").unwrap(); let m = std::fs::metadata(&p).unwrap().modified().unwrap(); let ok = m.elapsed().map(|e| e.as_secs() < 3600).unwrap_or(true); std::fs::remove_file(&p).unwrap(); format!("recent: {}", ok)');

add('metadata/accessed', 'accessed', FS('Metadata'), 'How Metadata::accessed works', 'When the file was last read (if the system tracks it).', {
  rows: [['a file']], call: 'meta.accessed()', note: 'often imprecise', outs: ['Ok(SystemTime)'],
  intro: 'Many systems update it lazily or not at all.',
  steps: [['Ask for the access time.', 0], ['Usually Ok.', [], 'o0']],
  result: 'available: true', resultCap: 'Do not rely on it for program logic.',
}, TMP('acc') + 'std::fs::write(&p, "x").unwrap(); let ok = std::fs::metadata(&p).unwrap().accessed().is_ok(); std::fs::remove_file(&p).unwrap(); format!("available: {}", ok)');

add('metadata/created', 'created', FS('Metadata'), 'How Metadata::created works', 'When the file was created (where the system records it).', {
  rows: [['a new file']], call: 'meta.created()', note: 'not on every OS', outs: ['Ok(SystemTime) or Err'],
  intro: 'Windows and macOS record it; some Linux file systems do not.',
  steps: [['Ask for the creation time.', 0], ['A recent time, if supported.', [], 'o0']],
  result: 'recent or unsupported: true', resultCap: 'Handle the Err case.',
}, TMP('cre') + 'std::fs::write(&p, "x").unwrap(); let ok = std::fs::metadata(&p).unwrap().created().map(|t| t.elapsed().map(|e| e.as_secs() < 3600).unwrap_or(true)).unwrap_or(true); std::fs::remove_file(&p).unwrap(); format!("recent or unsupported: {}", ok)');

add('metadata/permissions', 'permissions', FS('Metadata'), 'How Metadata::permissions works', 'The file\'s permissions.', {
  rows: [['a new file']], call: 'meta.permissions().readonly()', note: 'Permissions', outs: ['false'],
  intro: 'A newly written file is normally writable.',
  steps: [['Get the permissions.', 0], ['readonly() is false.', [], 'o0']],
  result: 'false', resultCap: 'On Unix, PermissionsExt gives the mode bits.',
}, TMP('perm') + 'std::fs::write(&p, "x").unwrap(); let r = std::fs::metadata(&p).unwrap().permissions().readonly(); std::fs::remove_file(&p).unwrap(); r.to_string()');

add('permissions/readonly', 'readonly', FS('Permissions'), 'How Permissions::readonly works', 'true if the file cannot be written.', {
  rows: [['normal', 'after set_readonly(true)']], call: 'perms.readonly()', note: 'write-protected?', outs: ['false', 'true'],
  intro: 'A simple, cross-platform permission check.',
  steps: [['Normal file: false.', 0, 'o0'], ['Write-protected: true.', 1, 'o1']],
  result: 'false, true', resultCap: 'On Unix it checks the write bits for everyone.',
}, TMP('ro') + 'std::fs::write(&p, "x").unwrap(); let mut pm = std::fs::metadata(&p).unwrap().permissions(); let a = pm.readonly(); pm.set_readonly(true); let b = pm.readonly(); std::fs::remove_file(&p).unwrap(); format!("{}, {}", a, b)');

add('permissions/set_readonly', 'set_readonly', FS('Permissions'), 'How Permissions::set_readonly works', 'Changes the read-only flag on a Permissions value (apply it with set_permissions).', {
  rows: [['writable file']], call: 'perms.set_readonly(true); fs::set_permissions(p, perms)?;', note: 'two steps', outs: ['file is read-only'],
  intro: 'Changing the value alone does not touch the file.',
  steps: [['The flag is set on the value.', 0], ['set_permissions applies it.', [], 'o0']],
  result: 'read-only: true', resultCap: 'Writes then fail with PermissionDenied.',
}, TMP('sro') + 'std::fs::write(&p, "x").unwrap(); let mut pm = std::fs::metadata(&p).unwrap().permissions(); pm.set_readonly(true); std::fs::set_permissions(&p, pm.clone()).unwrap(); let r = std::fs::metadata(&p).unwrap().permissions().readonly(); pm.set_readonly(false); std::fs::set_permissions(&p, pm).unwrap(); std::fs::remove_file(&p).unwrap(); format!("read-only: {}", r)');

add('fs/set_permissions', 'set_permissions', null, 'How fs::set_permissions works', 'Applies permissions to a file.', {
  rows: [['make read-only']], call: 'fs::set_permissions(p, perms)?', note: 'write to the disk', outs: ['writes now fail'],
  intro: 'Get the current permissions, change them, then apply.',
  steps: [['The file becomes read-only.', 0], ['Writing fails.', [], 'o0']],
  result: 'write failed: true', resultCap: 'File::set_permissions works on an open file.',
}, TMP('setp') + 'std::fs::write(&p, "x").unwrap(); let mut pm = std::fs::metadata(&p).unwrap().permissions(); pm.set_readonly(true); std::fs::set_permissions(&p, pm.clone()).unwrap(); let failed = std::fs::write(&p, "y").is_err(); pm.set_readonly(false); std::fs::set_permissions(&p, pm).unwrap(); std::fs::remove_file(&p).unwrap(); format!("write failed: {}", failed)');

add('file_type/is_file', 'is_file', FS('FileType'), 'How FileType::is_file works', 'true if the entry type is a regular file.', {
  rows: [['file entry']], call: 'ft.is_file()', note: 'from metadata or DirEntry', outs: ['true'],
  intro: 'One of three exclusive kinds.',
  steps: [['The type is "file".', 0], ['true.', [], 'o0']],
  result: 'true', resultCap: 'Exactly one of is_file, is_dir, is_symlink is true for normal entries.',
}, TMP('ftf') + 'std::fs::write(&p, "").unwrap(); let r = std::fs::metadata(&p).unwrap().file_type().is_file(); std::fs::remove_file(&p).unwrap(); r.to_string()');

add('file_type/is_dir', 'is_dir', FS('FileType'), 'How FileType::is_dir works', 'true if the entry type is a folder.', {
  rows: [['temp folder']], call: 'ft.is_dir()', note: 'a directory', outs: ['true'],
  intro: 'Use it to decide whether to recurse.',
  steps: [['The type is "dir".', 0], ['true.', [], 'o0']],
  result: 'true', resultCap: 'Pairs with read_dir for walking trees.',
}, 'std::fs::metadata(std::env::temp_dir()).unwrap().file_type().is_dir().to_string()');

add('file_type/is_symlink', 'is_symlink', FS('FileType'), 'How FileType::is_symlink works', 'true if the entry type is a symbolic link.', {
  rows: [['regular file']], call: 'ft.is_symlink()', note: 'use symlink_metadata', outs: ['false'],
  intro: 'Only symlink_metadata or DirEntry::file_type can report links.',
  steps: [['A normal file.', 0], ['false.', [], 'o0']],
  result: 'false', resultCap: 'Follow links with fs::metadata.',
}, TMP('fts') + 'std::fs::write(&p, "").unwrap(); let r = std::fs::symlink_metadata(&p).unwrap().file_type().is_symlink(); std::fs::remove_file(&p).unwrap(); r.to_string()');

add('fs/symlink_metadata', 'symlink_metadata', null, 'How fs::symlink_metadata works', 'Metadata of the path itself, without following a symlink.', {
  rows: [['a file']], call: 'fs::symlink_metadata(p)?', note: 'the link, not its target', outs: ['same as metadata for files'],
  intro: 'For a symlink you learn about the link; for files it equals metadata.',
  steps: [['Read the entry\'s own info.', 0], ['A regular file of 2 bytes.', [], 'o0']],
  result: '2', resultCap: 'Detect links with .is_symlink().',
}, TMP('slm') + 'std::fs::write(&p, "ab").unwrap(); let n = std::fs::symlink_metadata(&p).unwrap().len(); std::fs::remove_file(&p).unwrap(); n.to_string()');

add('fs/read_link', 'read_link', null, 'How fs::read_link works', 'The target a symbolic link points to.', {
  rows: [['a regular file']], call: 'fs::read_link(p)', note: 'only for symlinks', outs: ['Err (not a link)'],
  intro: 'Errors when the path is not a symlink.',
  steps: [['The path is a plain file.', 0], ['Err.', [], 'o0']],
  result: 'Err', resultCap: 'On a real symlink it returns the stored target path.',
}, TMP('rl') + 'std::fs::write(&p, "").unwrap(); let r = std::fs::read_link(&p).is_err(); std::fs::remove_file(&p).unwrap(); (if r { "Err" } else { "Ok" }).to_string()');

add('fs/hard_link', 'hard_link', null, 'How fs::hard_link works', 'A second name for the same file data.', {
  rows: [['a.txt', 'b.txt (link)']], call: 'fs::hard_link("a.txt", "b.txt")?', note: 'two names, one file', outs: ['both read "x"'],
  intro: 'Changes through one name are visible through the other.',
  steps: [['b.txt is created as another name.', [0, 1]], ['Reading it gives the same content.', [], 'o0']],
  result: '"x"', resultCap: 'The data is freed only when every name is removed.',
}, 'let a = std::env::temp_dir().join("ponder_q12_hla.txt"); let b = std::env::temp_dir().join("ponder_q12_hlb.txt"); let _ = std::fs::remove_file(&b); std::fs::write(&a, "x").unwrap(); std::fs::hard_link(&a, &b).unwrap(); let s = std::fs::read_to_string(&b).unwrap(); std::fs::remove_file(&a).unwrap(); std::fs::remove_file(&b).unwrap(); d(s)');

// ---------------------------------------------------------------- OpenOptions

add('openoptions/new', 'new', FS('OpenOptions'), 'How OpenOptions::new works', 'Starts describing how to open a file.', {
  rows: [['OpenOptions::new()']], call: 'OpenOptions::new().read(true).write(true).open(p)?', note: 'every flag off at first', outs: ['a configured File'],
  intro: 'Turn on the modes you need, then call open.',
  steps: [['All options start false.', 0], ['Chain the ones you want.', [], 'o0']],
  result: '"x"', resultCap: 'File::open and File::create are shortcuts.',
}, IO + TMP('oon') + 'std::fs::write(&p, "x").unwrap(); let mut s = String::new(); std::fs::OpenOptions::new().read(true).open(&p).unwrap().read_to_string(&mut s).unwrap(); std::fs::remove_file(&p).unwrap(); d(s)');

add('openoptions/read', 'read', FS('OpenOptions'), 'How OpenOptions::read works', 'Allows reading from the opened file.', {
  rows: [['read(true)']], call: 'OpenOptions::new().read(true).open(p)?', note: 'read access', outs: ['reads work'],
  intro: 'Without read(true), reads fail.',
  steps: [['Read access is requested.', 0], ['The contents can be read.', [], 'o0']],
  result: '"data"', resultCap: 'Same as File::open.',
}, IO + TMP('oor') + 'std::fs::write(&p, "data").unwrap(); let mut s = String::new(); std::fs::OpenOptions::new().read(true).open(&p).unwrap().read_to_string(&mut s).unwrap(); std::fs::remove_file(&p).unwrap(); d(s)');

add('openoptions/write', 'write', FS('OpenOptions'), 'How OpenOptions::write works', 'Allows writing; without truncate, it overwrites from the start.', {
  rows: [['file "abcdef"'], ['write "XY"']], call: 'OpenOptions::new().write(true).open(p)?.write_all(b"XY")', note: 'no truncation', outs: ['"XYcdef"'],
  intro: 'The rest of the old content stays.',
  steps: [['The file holds "abcdef".', 'a0'], ['"XY" overwrites the first two bytes.', 'b0', 'o0']],
  result: '"XYcdef"', resultCap: 'Add truncate(true) to start empty, or append(true) to add at the end.',
}, IO + TMP('oow') + 'std::fs::write(&p, "abcdef").unwrap(); std::fs::OpenOptions::new().write(true).open(&p).unwrap().write_all(b"XY").unwrap(); let s = std::fs::read_to_string(&p).unwrap(); std::fs::remove_file(&p).unwrap(); d(s)');

add('openoptions/truncate', 'truncate', FS('OpenOptions'), 'How OpenOptions::truncate works', 'Empties the file when opening it.', {
  rows: [['file "old content"']], call: 'OpenOptions::new().write(true).truncate(true).open(p)?', note: 'start empty', outs: ['""'],
  intro: 'Needs write(true).',
  steps: [['The file is opened...', 0], ['...and cut to length 0.', [], 'o0']],
  result: '""', resultCap: 'File::create does write + create + truncate.',
}, TMP('oot') + 'std::fs::write(&p, "old content").unwrap(); drop(std::fs::OpenOptions::new().write(true).truncate(true).open(&p).unwrap()); let s = std::fs::read_to_string(&p).unwrap(); std::fs::remove_file(&p).unwrap(); d(s)');

add('openoptions/create', 'create', FS('OpenOptions'), 'How OpenOptions::create works', 'Creates the file if it does not exist.', {
  rows: [['missing file']], call: 'OpenOptions::new().append(true).create(true).open(p)?', note: 'a log file', outs: ['created, then appended'],
  intro: 'Existing files are opened as they are.',
  steps: [['The file is missing: created.', 0], ['Writes go into it.', [], 'o0']],
  result: '"line"', resultCap: 'create_new fails if it already exists.',
}, IO + TMP('ooc') + 'std::fs::OpenOptions::new().append(true).create(true).open(&p).unwrap().write_all(b"line").unwrap(); let s = std::fs::read_to_string(&p).unwrap(); std::fs::remove_file(&p).unwrap(); d(s)');

add('openoptions/create_new', 'create_new', FS('OpenOptions'), 'How OpenOptions::create_new works', 'Creates a new file, failing if it already exists.', {
  rows: [['missing', 'existing']], call: 'OpenOptions::new().write(true).create_new(true).open(p)', note: 'never overwrite', outs: ['Ok', 'Err(AlreadyExists)'],
  intro: 'Atomic: no race between "check" and "create".',
  steps: [['Missing: created.', 0, 'o0'], ['Existing: AlreadyExists.', 1, 'o1']],
  result: 'Ok, Err(AlreadyExists)', resultCap: 'Good for lock files.',
}, TMP('oocn') + 'let a = std::fs::OpenOptions::new().write(true).create_new(true).open(&p).is_ok(); let b = std::fs::OpenOptions::new().write(true).create_new(true).open(&p).map(|_| ()).map_err(|e| e.kind()); std::fs::remove_file(&p).unwrap(); format!("{}, {:?}", if a { "Ok" } else { "Err" }, b)');

add('openoptions/open', 'open', FS('OpenOptions'), 'How OpenOptions::open works', 'Opens the file with the chosen options.', {
  rows: [['no options set']], call: 'OpenOptions::new().open(p)', note: 'needs at least one mode', outs: ['Err(InvalidInput)'],
  intro: 'Without read, write or append, opening fails.',
  steps: [['No access mode chosen.', 0], ['InvalidInput.', [], 'o0']],
  result: 'Err(InvalidInput)', resultCap: 'Always pick read, write or append.',
}, TMP('ooo') + 'std::fs::write(&p, "").unwrap(); let r = std::fs::OpenOptions::new().open(&p).map(|_| ()).map_err(|e| e.kind()); std::fs::remove_file(&p).unwrap(); d(r)');

add('file/options', 'options', FS('File'), 'How File::options works', 'A shortcut for OpenOptions::new().', {
  rows: [['File::options()']], call: 'File::options().append(true).open(p)?', note: 'same builder', outs: ['appending File'],
  intro: 'Reads nicely: File::options().read(true)...',
  steps: [['Get a fresh OpenOptions.', 0], ['Configure and open.', [], 'o0']],
  result: '"ab"', resultCap: 'Identical to OpenOptions::new().',
}, IO + TMP('fo') + 'std::fs::write(&p, "a").unwrap(); std::fs::File::options().append(true).open(&p).unwrap().write_all(b"b").unwrap(); let s = std::fs::read_to_string(&p).unwrap(); std::fs::remove_file(&p).unwrap(); d(s)');

// ---------------------------------------------------------------- File

add('file/create_new', 'create_new', FS('File'), 'How File::create_new works', 'Creates a new file for writing; fails if it exists.', {
  rows: [['missing', 'existing']], call: 'File::create_new(p)', note: 'no overwriting', outs: ['Ok(File)', 'Err(AlreadyExists)'],
  intro: 'The safe alternative to File::create.',
  steps: [['Missing: created.', 0, 'o0'], ['Existing: error.', 1, 'o1']],
  result: 'Ok, Err(AlreadyExists)', resultCap: 'Same as OpenOptions create_new(true).',
}, TMP('fcn') + 'let a = std::fs::File::create_new(&p).is_ok(); let b = std::fs::File::create_new(&p).map(|_| ()).map_err(|e| e.kind()); std::fs::remove_file(&p).unwrap(); format!("{}, {:?}", if a { "Ok" } else { "Err" }, b)');

add('file/metadata', 'metadata', FS('File'), 'How File::metadata works', 'Metadata of an open file.', {
  rows: [['open file "1234"']], call: 'f.metadata()?.len()', note: 'no path needed', outs: ['4'],
  intro: 'Asks about the file you already have open.',
  steps: [['The file is open.', 0], ['Its size is 4.', [], 'o0']],
  result: '4', resultCap: 'Cannot be fooled by the path changing meanwhile.',
}, TMP('fm') + 'std::fs::write(&p, "1234").unwrap(); let n = std::fs::File::open(&p).unwrap().metadata().unwrap().len(); std::fs::remove_file(&p).unwrap(); n.to_string()');

add('file/set_len', 'set_len', FS('File'), 'How File::set_len works', 'Truncates or extends the file to a size.', {
  rows: [['"abcdef"']], call: 'f.set_len(3)?', note: 'cut or pad with zeros', outs: ['"abc"'],
  intro: 'Growing fills the new space with zero bytes.',
  steps: [['The file is 6 bytes.', 0], ['It becomes 3.', [], 'o0']],
  result: '"abc"', resultCap: 'Needs write access.',
}, TMP('fsl') + 'std::fs::write(&p, "abcdef").unwrap(); std::fs::OpenOptions::new().write(true).open(&p).unwrap().set_len(3).unwrap(); let s = std::fs::read_to_string(&p).unwrap(); std::fs::remove_file(&p).unwrap(); d(s)');

add('file/sync_all', 'sync_all', FS('File'), 'How File::sync_all works', 'Waits until the file\'s data and metadata are really on disk.', {
  rows: [['after writing']], call: 'f.write_all(data)?; f.sync_all()?;', note: 'survive a power cut', outs: ['data is durable'],
  intro: 'Writes normally sit in OS buffers for a while.',
  steps: [['Data is written to the OS.', 0], ['sync_all flushes it to the device.', [], 'o0']],
  result: 'Ok(())', resultCap: 'Slow: use it for important data only.',
}, IO + TMP('sa') + 'let mut f = std::fs::File::create(&p).unwrap(); f.write_all(b"x").unwrap(); let r = f.sync_all().map_err(|_| ()); drop(f); std::fs::remove_file(&p).unwrap(); d(r)');

add('file/sync_data', 'sync_data', FS('File'), 'How File::sync_data works', 'Like sync_all, but may skip metadata such as times.', {
  rows: [['after writing']], call: 'f.sync_data()?', note: 'a bit faster', outs: ['data is durable'],
  intro: 'Enough when only the contents matter.',
  steps: [['Data is written.', 0], ['It is flushed to the device.', [], 'o0']],
  result: 'Ok(())', resultCap: 'Databases often use it.',
}, IO + TMP('sd') + 'let mut f = std::fs::File::create(&p).unwrap(); f.write_all(b"x").unwrap(); let r = f.sync_data().map_err(|_| ()); drop(f); std::fs::remove_file(&p).unwrap(); d(r)');

add('file/try_clone', 'try_clone', FS('File'), 'How File::try_clone works', 'A second handle to the same open file, sharing the position.', {
  rows: [['f writes "a"', 'g writes "b"']], call: 'let mut g = f.try_clone()?;', note: 'shared cursor', outs: ['file "ab"'],
  intro: 'Both handles move the same read/write position.',
  steps: [['f writes "a".', 0], ['g continues after it with "b".', 1, 'o0']],
  result: '"ab"', resultCap: 'Useful to give one handle to another thread.',
}, IO + TMP('tc') + '{ let mut f = std::fs::File::create(&p).unwrap(); let mut g = f.try_clone().unwrap(); f.write_all(b"a").unwrap(); g.write_all(b"b").unwrap(); } let s = std::fs::read_to_string(&p).unwrap(); std::fs::remove_file(&p).unwrap(); d(s)');

add('file/set_permissions', 'set_permissions', FS('File'), 'How File::set_permissions works', 'Changes the permissions of an open file.', {
  rows: [['open file']], call: 'f.set_permissions(perms)?', note: 'through the handle', outs: ['now read-only'],
  intro: 'Same as fs::set_permissions, but on an open file.',
  steps: [['Make the permissions read-only.', 0], ['Apply them through the handle.', [], 'o0']],
  result: 'read-only: true', resultCap: 'Avoids races with the path being replaced.',
}, TMP('fsp') + 'std::fs::write(&p, "x").unwrap(); let f = std::fs::OpenOptions::new().write(true).open(&p).unwrap(); let mut pm = f.metadata().unwrap().permissions(); pm.set_readonly(true); f.set_permissions(pm.clone()).unwrap(); let r = std::fs::metadata(&p).unwrap().permissions().readonly(); pm.set_readonly(false); f.set_permissions(pm).unwrap(); drop(f); std::fs::remove_file(&p).unwrap(); format!("read-only: {}", r)');

add('file/set_modified', 'set_modified', FS('File'), 'How File::set_modified works', 'Sets the file\'s last-modified time.', {
  rows: [['set to 1 Jan 2000']], call: 'f.set_modified(time)?', note: 'like touch -t', outs: ['modified() = 2000-01-01'],
  intro: 'Build tools and backups use these times.',
  steps: [['A SystemTime for 2000.', 0], ['The file now reports it.', [], 'o0']],
  result: 'true', resultCap: 'Needs write access.',
}, TMP('fsm') + 'std::fs::write(&p, "x").unwrap(); let t = std::time::UNIX_EPOCH + std::time::Duration::from_secs(946_684_800); let f = std::fs::OpenOptions::new().write(true).open(&p).unwrap(); f.set_modified(t).unwrap(); drop(f); let ok = std::fs::metadata(&p).unwrap().modified().unwrap() == t; std::fs::remove_file(&p).unwrap(); ok.to_string()');

add('file/set_times', 'set_times', FS('File'), 'How File::set_times works', 'Sets several file times at once using FileTimes.', {
  rows: [['FileTimes with modified']], call: 'f.set_times(FileTimes::new().set_modified(t))?', note: 'times builder', outs: ['modified updated'],
  intro: 'Only the times you set are changed.',
  steps: [['Build the times.', 0], ['Apply them.', [], 'o0']],
  result: 'true', resultCap: 'set_modified is the shortcut for one time.',
}, TMP('fst') + 'std::fs::write(&p, "x").unwrap(); let t = std::time::UNIX_EPOCH + std::time::Duration::from_secs(1_000_000_000); let f = std::fs::OpenOptions::new().write(true).open(&p).unwrap(); f.set_times(std::fs::FileTimes::new().set_modified(t)).unwrap(); drop(f); let ok = std::fs::metadata(&p).unwrap().modified().unwrap() == t; std::fs::remove_file(&p).unwrap(); ok.to_string()');

add('file_times/new', 'new', FS('FileTimes'), 'How FileTimes::new works', 'An empty set of file times to apply with set_times.', {
  rows: [['FileTimes::new()']], call: 'FileTimes::new().set_accessed(t).set_modified(t)', note: 'nothing set yet', outs: ['a times value'],
  intro: 'Unset times are left unchanged when applied.',
  steps: [['Start empty.', 0], ['Add the times you want.', [], 'o0']],
  result: 'ok', resultCap: 'Then call File::set_times.',
}, 'let t = std::time::UNIX_EPOCH; let _ft = std::fs::FileTimes::new().set_accessed(t).set_modified(t); String::from("ok")');

add('file_times/set_modified', 'set_modified', FS('FileTimes'), 'How FileTimes::set_modified works', 'Chooses the modified time in a FileTimes value.', {
  rows: [['time t']], call: 'FileTimes::new().set_modified(t)', note: 'builder step', outs: ['modified = t when applied'],
  intro: 'Returns the updated FileTimes.',
  steps: [['Record t as the modified time.', 0], ['Apply with set_times.', [], 'o0']],
  result: 'true', resultCap: 'set_accessed works the same way.',
}, TMP('ftm') + 'std::fs::write(&p, "x").unwrap(); let t = std::time::UNIX_EPOCH + std::time::Duration::from_secs(1_234_567_890); let f = std::fs::OpenOptions::new().write(true).open(&p).unwrap(); f.set_times(std::fs::FileTimes::new().set_modified(t)).unwrap(); drop(f); let ok = std::fs::metadata(&p).unwrap().modified().unwrap() == t; std::fs::remove_file(&p).unwrap(); ok.to_string()');

add('file_times/set_accessed', 'set_accessed', FS('FileTimes'), 'How FileTimes::set_accessed works', 'Chooses the last-access time in a FileTimes value.', {
  rows: [['time t']], call: 'FileTimes::new().set_accessed(t)', note: 'builder step', outs: ['accessed = t when applied'],
  intro: 'Some systems do not store access times precisely.',
  steps: [['Record t.', 0], ['Apply with set_times.', [], 'o0']],
  result: 'Ok(())', resultCap: 'Pairs with set_modified.',
}, TMP('fta') + 'std::fs::write(&p, "x").unwrap(); let t = std::time::UNIX_EPOCH + std::time::Duration::from_secs(1_000_000_000); let f = std::fs::OpenOptions::new().write(true).open(&p).unwrap(); let r = f.set_times(std::fs::FileTimes::new().set_accessed(t)).map_err(|_| ()); drop(f); std::fs::remove_file(&p).unwrap(); d(r)');

add('file/lock', 'lock', FS('File'), 'How File::lock works', 'Takes an exclusive lock on the file, waiting if another process holds one.', {
  rows: [['process A', 'process B']], call: 'f.lock()?; ...; f.unlock()?;', note: 'cooperative locking', outs: ['one at a time'],
  intro: 'Other programs that also lock will wait; programs that ignore locks are not stopped.',
  steps: [['A takes the lock.', 0], ['B waits until A unlocks.', 1, 'o0']],
  result: 'locked: true', resultCap: 'The lock is released when the File is closed.',
}, TMP('lk') + 'std::fs::write(&p, "").unwrap(); let f = std::fs::File::open(&p).unwrap(); let ok = f.lock().is_ok(); f.unlock().unwrap(); drop(f); std::fs::remove_file(&p).unwrap(); format!("locked: {}", ok)');

add('file/lock_shared', 'lock_shared', FS('File'), 'How File::lock_shared works', 'Takes a shared (read) lock: many readers, no writer.', {
  rows: [['reader 1', 'reader 2']], call: 'f.lock_shared()?', note: 'like RwLock::read for files', outs: ['both hold it'],
  intro: 'An exclusive lock must wait until all shared locks are gone.',
  steps: [['Reader 1 locks shared.', 0], ['Reader 2 can too.', 1, 'o0']],
  result: 'both: true', resultCap: 'lock() is the exclusive version.',
}, TMP('lks') + 'std::fs::write(&p, "").unwrap(); let a = std::fs::File::open(&p).unwrap(); let b = std::fs::File::open(&p).unwrap(); let ok = a.lock_shared().is_ok() && b.lock_shared().is_ok(); drop(a); drop(b); std::fs::remove_file(&p).unwrap(); format!("both: {}", ok)');

add('file/try_lock', 'try_lock', FS('File'), 'How File::try_lock works', 'Takes an exclusive lock only if it is free right now.', {
  rows: [['free', 'held by another handle']], call: 'f.try_lock()', note: 'non-blocking', outs: ['Ok', 'Err(WouldBlock)'],
  intro: 'Good for "is another instance already running?".',
  steps: [['Free: locked.', 0, 'o0'], ['Held: error.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'try_lock_shared is the shared version.',
}, TMP('tlk') + 'std::fs::write(&p, "").unwrap(); let a = std::fs::File::open(&p).unwrap(); let b = std::fs::File::open(&p).unwrap(); let x = a.try_lock().is_ok(); let y = b.try_lock().is_ok(); drop(a); drop(b); std::fs::remove_file(&p).unwrap(); format!("{}, {}", if x { "Ok" } else { "Err" }, if y { "Ok" } else { "Err" })');

add('file/try_lock_shared', 'try_lock_shared', FS('File'), 'How File::try_lock_shared works', 'Takes a shared lock only if no exclusive lock is held.', {
  rows: [['no writer', 'writer holds lock']], call: 'f.try_lock_shared()', note: 'non-blocking read lock', outs: ['Ok', 'Err'],
  intro: 'Fails at once while someone has the exclusive lock.',
  steps: [['No writer: Ok.', 0, 'o0'], ['Writer present: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'Release with unlock or by closing.',
}, TMP('tlks') + 'std::fs::write(&p, "").unwrap(); let a = std::fs::File::open(&p).unwrap(); let b = std::fs::File::open(&p).unwrap(); let x = a.try_lock_shared().is_ok(); a.unlock().unwrap(); b.lock().unwrap(); let y = a.try_lock_shared().is_ok(); drop(a); drop(b); std::fs::remove_file(&p).unwrap(); format!("{}, {}", if x { "Ok" } else { "Err" }, if y { "Ok" } else { "Err" })');

add('file/unlock', 'unlock', FS('File'), 'How File::unlock works', 'Releases a lock taken with lock or lock_shared.', {
  rows: [['locked by a']], call: 'a.unlock()?', note: 'let others in', outs: ['b can lock now'],
  intro: 'Closing the file also releases it.',
  steps: [['a holds the lock; b cannot get it.', 0], ['After unlock, b can.', [], 'o0']],
  result: 'false, true', resultCap: 'Unlock as soon as you are done.',
}, TMP('ulk') + 'std::fs::write(&p, "").unwrap(); let a = std::fs::File::open(&p).unwrap(); let b = std::fs::File::open(&p).unwrap(); a.lock().unwrap(); let x = b.try_lock().is_ok(); a.unlock().unwrap(); let y = b.try_lock().is_ok(); drop(a); drop(b); std::fs::remove_file(&p).unwrap(); format!("{}, {}", x, y)');

module.exports = list;
