// Runs the itertools examples shown in the Ponder animations and prints the results as JSON.
use itertools::Itertools;

fn main() {
    let interleave: Vec<i32> = (1..7).interleave(vec![-1, -2]).collect();
    let dedup: Vec<i32> = vec![1, 1, 2, 3, 3, 2, 2].into_iter().dedup().collect();
    println!("{{\"interleave\":{:?},\"dedup\":{:?}}}", interleave, dedup);
}
