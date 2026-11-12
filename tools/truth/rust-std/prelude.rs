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
