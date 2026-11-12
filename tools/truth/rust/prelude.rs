// Shared by every truth case (see Cargo.toml). Each case is a closure body that returns the String the animation shows.
#![allow(unused_imports, unstable_name_collisions, dead_code, unused_variables, unused_mut)]
use std::collections::{BTreeMap, HashMap};
use std::fmt::{Debug, Display};
use itertools::{Either, FoldWhile::{Continue, Done}, Itertools};

fn d<T: Debug>(t: T) -> String { format!("{:?}", t) }
fn j<I: IntoIterator>(it: I) -> String where I::Item: Display { it.into_iter().map(|x| x.to_string()).collect::<Vec<_>>().join(", ") }
fn jd<I: IntoIterator>(it: I) -> String where I::Item: Debug { it.into_iter().map(|x| format!("{:?}", x)).collect::<Vec<_>>().join(", ") }
use regex::Regex;
use serde_json::{json, Value};
use chrono::{Datelike, Days, Months, NaiveDate, NaiveTime};
use indexmap::{IndexMap, IndexSet};
use num_integer::Integer;
use heck::{ToKebabCase, ToShoutySnakeCase, ToSnakeCase, ToTitleCase, ToUpperCamelCase};
use base64::Engine as _;
use unicode_segmentation::UnicodeSegmentation;
use petgraph::graph::{DiGraph, NodeIndex, UnGraph};
use petgraph::algo::{astar, connected_components, dijkstra, is_cyclic_directed, toposort};
use petgraph::visit::{Bfs, Dfs};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct User { name: String, age: u32 }
