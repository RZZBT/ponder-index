// Shared by every Rust library truth case (see Cargo.toml). Each case is a closure body that returns the String the
// animation shows. Nothing else is imported here: every case brings its own `use` lines, so no extension trait of one
// crate can change which method another case calls.
#![allow(unused_imports, unstable_name_collisions, dead_code, unused_variables, unused_mut, deprecated)]
use std::fmt::{Debug, Display};

fn d<T: Debug>(t: T) -> String { format!("{:?}", t) }
fn j<I: IntoIterator>(it: I) -> String where I::Item: Display { it.into_iter().map(|x| x.to_string()).collect::<Vec<_>>().join(", ") }
fn jd<I: IntoIterator>(it: I) -> String where I::Item: Debug { it.into_iter().map(|x| format!("{:?}", x)).collect::<Vec<_>>().join(", ") }
/// A temporary folder of its own for one case (removed first if an earlier run left it).
fn tmp(name: &str) -> std::path::PathBuf { let p = std::env::temp_dir().join(format!("ponder_libs_{}", name)); let _ = std::fs::remove_dir_all(&p); std::fs::create_dir_all(&p).unwrap(); p }

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, PartialEq)]
struct User { name: String, age: u32 }
/// Runs a future to completion on a fresh single-threaded tokio runtime (timers and I/O enabled).
fn rt<F: std::future::Future>(f: F) -> F::Output { tokio::runtime::Builder::new_current_thread().enable_all().build().unwrap().block_on(f) }
