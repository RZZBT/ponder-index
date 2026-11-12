// serde_json: 8 animations (#50-57). The truth prelude defines
//   #[derive(Serialize, Deserialize, Debug)] struct User { name: String, age: u32 }
const { Scene, pick, lines } = require('./scene.cjs');
const R = String.raw;
const A = [];
const add = (key, title, description, build, rs, expect, claim, sym) => A.push({ key, title, description, build, rs, expect, claim, sym });
const ANN = 'User { name: "Ann".into(), age: 30 }';

add('to-string', 'How serde_json::to_string() works', 'Turns a value into a compact JSON string; struct fields become keys.', () => pick({
  call: 'serde_json::to_string(&user)', note: 'user = User { name: "Ann", age: 30 }, #[derive(Serialize)]', rows: [['name: "Ann"', 'age: 30']],
  outs: ['{', '"name":"Ann"', ',', '"age":30', '}'], outFill: 'success',
  intro: '#[derive(Serialize)] lets serde walk the struct field by field. to_string() writes each part as JSON text.',
  steps: [
    { cap: 'A struct becomes a JSON object, so the output starts with {.', out: [0] },
    { cap: 'The field name becomes the key "name". Its value is a String, so it is written in quotes: "Ann".', src: ['a0'], out: [1] },
    { cap: 'A comma separates the entries. The field age becomes "age"; 30 is a number, so it has no quotes.', src: ['a1'], out: [2, 3] },
    { cap: 'The object is closed with }. to_string() adds no spaces or line breaks.', out: [4] },
  ],
  result: '{"name":"Ann","age":30}', resultCap: 'to_string(&user) returns Ok with {"name":"Ann","age":30}. The keys are in the order the fields are declared.',
}), `serde_json::to_string(&${ANN}).unwrap()`, '{"name":"Ann","age":30}');

add('to-string-pretty', 'How serde_json::to_string_pretty() works', 'Same JSON as to_string(), laid out on several lines for people to read.', () => lines({
  call: 'serde_json::to_string_pretty(&user)', note: 'user = User { name: "Ann", age: 30 }', y0: 200, dy: 60,
  lines: ['{', '  "name": "Ann",', '  "age": 30', '}'],
  intro: 'to_string_pretty() writes the same data as to_string(), but with line breaks, 2-space indentation and a space after each colon.',
  steps: [
    { cap: 'The object opens on its own line.', show: [0] },
    { cap: 'Each entry gets its own line, indented by 2 spaces: "name": "Ann", followed by a comma.', show: [1] },
    { cap: 'The last entry has no comma after it.', show: [2] },
    { cap: 'The closing } goes on its own line, back at the left edge.', show: [3] },
  ],
  result: 'the same data, readable', resultCap: 'Compact: {"name":"Ann","age":30}. Pretty: the four lines shown. A parser reads both as the same value.',
}), `serde_json::to_string_pretty(&${ANN}).unwrap()`, '{\n  "name": "Ann",\n  "age": 30\n}', '  "name": "Ann",');

add('from-str', 'How serde_json::from_str() works', 'Parses JSON text into a typed value; a missing field is an error.', () => lines({
  call: 'serde_json::from_str::<User>(text)', note: '#[derive(Deserialize)] struct User { name: String, age: u32 }', y0: 185, dy: 56,
  lines: ['text = {"name":"Ann","age":30}', '"name" → name: "Ann",  "age" → age: 30', 'Ok(User { name: "Ann", age: 30 })', 'text = {"name":"Ann"}', 'no "age" key, and age is not an Option', 'Err(missing field `age` at line 1 column 14)'],
  intro: 'from_str() reads JSON text and fills in the struct. The type, User, says which keys are needed and what type each value must have.',
  steps: [
    { cap: 'Each key is matched to the field with the same name, and each value is checked: "Ann" is a string, 30 fits in a u32.', show: [0, 1] },
    { cap: 'All fields were found, so the result is Ok(User).', show: [2] },
    { cap: 'Now the JSON has no "age" key.', show: [3] },
    { cap: 'age has no default and is not an Option, so the value cannot be built.', show: [4] },
    { cap: 'from_str() returns an Err that names the missing field and the position where the object ended.', show: [5] },
  ],
  result: 'Ok(User) / Err(missing field `age`)', resultCap: 'Make a field Option<u32> or add #[serde(default)] when it may be missing. Unknown extra keys are ignored by default.',
}), R`format!("{:?} / {}", serde_json::from_str::<User>(r#"{"name":"Ann","age":30}"#).unwrap(), serde_json::from_str::<User>(r#"{"name":"Ann"}"#).unwrap_err())`, 'User { name: "Ann", age: 30 } / missing field `age` at line 1 column 14', 'missing field `age` at line 1 column 14');

add('to-value', 'How serde_json::to_value() works', 'Turns a value into a serde_json::Value, the general JSON tree.', () => {
  const sc = new Scene('serde_json::to_value(&user)', 'user = User { name: "Ann", age: 30 }');
  sc.row('a', ['name: "Ann"', 'age: 30'], 200);
  sc.box('root', 'Value::Object', 500, 320, { fill: 'warning', visible: false });
  sc.box('k0', '"age": Number(30)', 320, 450, { fill: 'success', visible: false });
  sc.box('k1', '"name": String("Ann")', 690, 450, { fill: 'success', visible: false });
  sc.intro('to_value() builds a tree in memory instead of text. Every JSON thing has a Value variant: Null, Bool, Number, String, Array, Object.');
  sc.step('The struct becomes Value::Object, a map from String keys to Values.', sc.show('root'));
  sc.step('Each field becomes an entry: "Ann" → Value::String("Ann") and 30 → Value::Number(30).', [sc.hi(['a0', 'a1'], 'warning'), sc.show(['k0', 'k1'])]);
  sc.step('The map is a BTreeMap by default, so the keys are sorted: "age" comes before "name". Enable the preserve_order feature to keep the field order.', sc.reset(['a0', 'a1']));
  sc.result('Object {"age": Number(30), "name": String("Ann")}', 'You can now read and change the tree, e.g. v["age"] = json!(31), and turn it back into a struct with from_value().');
  return sc.build();
}, `d(serde_json::to_value(&${ANN}).unwrap())`, 'Object {"age": Number(30), "name": String("Ann")}');

add('from-value', 'How serde_json::from_value() works', 'Turns a serde_json::Value tree into a typed struct.', () => pick({
  call: 'serde_json::from_value::<User>(v)', note: 'v = json!({"name": "Ann", "age": 30})', rows: [['"name": String("Ann")', '"age": Number(30)']], outs: ['name: "Ann"', 'age: 30'],
  intro: 'from_value() is from_str() for a Value that is already parsed. It takes the Value by value (it is moved, not borrowed).',
  steps: [
    { cap: 'The entry "name" fills the field name; String("Ann") becomes the Rust String "Ann".', src: ['a0'], out: [0] },
    { cap: 'The entry "age" fills age; Number(30) must fit in a u32, which it does.', src: ['a1'], out: [1] },
    { cap: 'Every field is filled, so the result is Ok(User). A Number(-1) or String("30") for age would be an Err instead.', eq: 'types are checked here' },
  ],
  result: 'User { name: "Ann", age: 30 }', resultCap: 'from_value(v) gives Ok(User { name: "Ann", age: 30 }). Pass v.clone() if you still need the Value afterwards.',
}), R`d(serde_json::from_value::<User>(json!({"name": "Ann", "age": 30})).unwrap())`, 'User { name: "Ann", age: 30 }');

add('value-get', 'How Value::get() works', 'Looks up a key (or an index) and returns None when it is not there.', () => pick({
  call: 'v.get("name")  and  v.get("zip")', note: 'v = json!({"name": "Ann", "age": 30})', rows: [['"name": "Ann"', '"age": 30']],
  intro: 'get() takes a key for objects or an index for arrays. It returns Option<&Value>, so a missing key is not a panic.',
  steps: [
    { cap: 'v.get("name"): the key exists, so it returns Some(&String("Ann")).', src: ['a0'], mark: { success: ['a0'] }, eq: 'Some(String("Ann"))' },
    { cap: 'v.get("zip"): no entry has that key, so it returns None.', eq: 'None' },
    { cap: 'v["zip"] would also not panic: indexing a Value returns Value::Null for a missing key. get() makes the difference visible.', eq: 'v["zip"] → Null' },
  ],
  result: 'Some(String("Ann")) / None', resultCap: 'Chain with and_then: v.get("name").and_then(|n| n.as_str()) gives Some("Ann").',
}), R`let v = json!({"name": "Ann", "age": 30}); format!("{:?} / {:?}", v.get("name"), v.get("zip"))`, 'Some(String("Ann")) / None', null, 'value-get');

add('value-pointer', 'How Value::pointer() works', 'Follows a path like "/user/tags/0" into nested JSON.', () => pick({
  call: 'v.pointer("/user/tags/0")', note: 'v = json!({"user": {"tags": ["admin", "dev"]}})', rows: [['/user', '/tags', '/0']], rowFills: ['surface'],
  outs: ['{"tags": [...]}', '["admin", "dev"]', '"admin"'], outFill: 'warning',
  intro: 'pointer() takes a JSON Pointer: path segments separated by /. Each segment is an object key or an array index.',
  steps: [
    { cap: '"user" is a key of the top object: step into its value.', src: ['a0'], out: [0] },
    { cap: '"tags" is a key of that object: its value is an array.', src: ['a1'], out: [1] },
    { cap: 'In an array, the segment is an index: 0 is the first item, "admin".', src: ['a2'], out: [2], mark: { success: ['o2'] } },
  ],
  result: 'Some(String("admin"))', resultCap: 'pointer("/user/tags/0") is Some("admin"). If any step is missing, for example "/user/tags/5", the result is None.',
}), R`let v = json!({"user": {"tags": ["admin", "dev"]}}); d(v.pointer("/user/tags/0"))`, 'Some(String("admin"))');

add('value-as-i64', 'How Value::as_i64() works', 'Reads a JSON number as i64; anything else gives None.', () => pick({
  call: 'json!(30).as_i64()  and  json!("30").as_i64()', note: 'a JSON string is not a number', rows: [['Number(30)', 'String("30")']],
  intro: 'as_i64() returns Some(n) only when the Value is a number that fits in an i64.',
  steps: [
    { cap: 'Number(30) is a whole number that fits: Some(30).', src: ['a0'], mark: { success: ['a0'] }, eq: 'Some(30)' },
    { cap: 'String("30") holds text. as_i64() does not convert text, so it gives None.', src: ['a1'], srcColor: 'danger', eq: 'None' },
    { cap: 'Number(30.5) would also give None: it is not a whole number. Use as_f64() for it, or parse the string yourself.', eq: 'json!(30.5).as_i64() → None' },
  ],
  result: 'Some(30) / None', resultCap: 'JSON from other programs often has numbers in quotes. as_str() and then .parse::<i64>() reads those.',
}), R`format!("{:?} / {:?}", json!(30).as_i64(), json!("30").as_i64())`, 'Some(30) / None');

module.exports = A;
