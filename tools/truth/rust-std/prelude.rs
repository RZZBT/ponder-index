// Shared by every standard-library truth case. Each case is a closure body that returns the String the animation's
// result slide shows. Standard library only.
#![allow(unused_imports, dead_code, unused_variables, unused_mut, clippy::all)]
use std::cell::{Cell, RefCell};
use std::cmp::{Ordering, Reverse};
use std::collections::{BTreeMap, BTreeSet, BinaryHeap, HashMap, HashSet, VecDeque};
use std::fmt::{Debug, Display};
use std::rc::Rc;

/// Debug form: `[1, 2]`, `Some(3)`, `"text"`.
fn d<T: Debug>(t: T) -> String { format!("{:?}", t) }
/// Items joined with ", " using Display: `1, 2, 3`.
fn j<I: IntoIterator>(it: I) -> String where I::Item: Display { it.into_iter().map(|x| x.to_string()).collect::<Vec<_>>().join(", ") }
/// Items joined with ", " using Debug: `(1, 'a'), (2, 'b')`.
fn jd<I: IntoIterator>(it: I) -> String where I::Item: Debug { it.into_iter().map(|x| format!("{:?}", x)).collect::<Vec<_>>().join(", ") }
/// A HashMap or HashSet printed in sorted order, so the result does not depend on hashing.
fn sorted_map<K: Ord + Debug, V: Debug>(m: &HashMap<K, V>) -> String { let b: BTreeMap<_, _> = m.iter().collect(); format!("{:?}", b) }
fn sorted_set<T: Ord + Debug>(s: &HashSet<T>) -> String { let b: BTreeSet<_> = s.iter().collect(); format!("{:?}", b) }

/// Lets a case start this same program as a child process that does one thing which would end the checker itself:
/// PONDER_TRUTH_CHILD=exit3 calls std::process::exit(3), =abort calls std::process::abort().
fn child_role() {
    match std::env::var("PONDER_TRUTH_CHILD").as_deref() {
        Ok("exit3") => std::process::exit(3),
        Ok("abort") => std::process::abort(),
        Ok("alloc_error") => std::alloc::handle_alloc_error(std::alloc::Layout::new::<u64>()),
        _ => {}
    }
}
/// Runs this program again as a child with the given role and returns its exit status.
fn run_child(role: &str) -> std::process::ExitStatus {
    std::process::Command::new(std::env::current_exe().unwrap()).env("PONDER_TRUTH_CHILD", role)
        .stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null()).status().unwrap()
}
