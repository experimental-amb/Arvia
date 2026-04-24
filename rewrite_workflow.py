import json

with open('workflow.json', 'r', encoding='utf-8') as f:
    wf = json.load(f)

# Delete 'Extract Keyword'
wf['nodes'] = [n for n in wf['nodes'] if n['name'] != 'Extract Keyword']

# Update Query Properties
for n in wf['nodes']:
    if n['name'] == 'Query Properties':
        n['parameters']['query'] = "=SELECT * FROM properties WHERE comuna ILIKE '%{{ $json.params.comuna }}%' AND (bedrooms >= {{ $json.params.dormitorios || 0 }} OR bedrooms IS NULL) AND (bathrooms >= {{ $json.params.banos || 0 }} OR bathrooms IS NULL) AND (sqm >= {{ $json.params.sqm || 0 }} OR sqm IS NULL) LIMIT 3;"
        n['position'] = [2900, 150]
    elif n['name'] == 'Format Property':
        n['position'] = [3100, 150]
        n['parameters']['functionCode'] = "const props = $input.all().map(i => i.json).filter(p => p && p.id);\nconst ctx = $('Parse Params').item.json;\nlet reply;\nif (props.length === 0) {\n  reply = 'No encontré propiedades con esas características 😕\\n¿Te gustaría ajustar los filtros (menos dormitorios o cambiar la comuna)?';\n} else {\n  reply = '🏡 *Propiedades encontradas:*\\n\\n';\n  props.forEach((p, i) => {\n    const precio = p.price ? '$' + Number(p.price).toLocaleString('es-CL') : 'Consultar';\n    reply += `${i+1}.\\n📍 *${p.title || 'Propiedad'}*\\n📍 Comuna: ${p.comuna || '-'}\\n💰 Precio: ${precio}\\n🛏 Dorm: ${p.bedrooms || p.dormitorios || '-'}\\n🛁 Baños: ${p.bathrooms || p.banos || '-'}\\n📐 M2: ${p.sqm || '-'}\\n\\n`;\n  });\n  reply += '¿Te interesa alguna para agendar visita? 👇';\n}\nreturn [{ json: { reply, reply_db: reply.replace(/'/g, \"''\"), user_id: ctx.user_id, chat_id: ctx.chat_id } }];"
    elif n['name'] == 'Prepare Send':
        n['parameters']['functionCode'] = "const chat_id = $('Extract Data').item.json.chat_id;\nlet reply = 'Procesado.';\nconst sources = ['Lead Reply', 'Format Property', 'Format Ask', 'Static Response', 'Format AI'];\nfor (const name of sources) {\n  try {\n    if ($(`${name}`).isExecuted) {\n      const r = $(`${name}`).item.json.reply;\n      if (r) { reply = r; break; }\n    }\n  } catch(e) {}\n}\nreturn [{ json: { chat_id, reply } }];"

# Add new nodes
new_nodes = [
    {
      "parameters": {
        "method": "POST",
        "url": "http://host.docker.internal:11434/api/generate",
        "sendBody": True, "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ model: 'llama3.1:8b', prompt: 'Analiza el historial y el mensaje buscando parámetros inmobiliarios. Devuelve SOLO un objeto JSON válido con: \"comuna\" (string o null si no menciona), \"dormitorios\" (numero o null), \"banos\" (numero o null), \"sqm\" (numero para metros cuadrados o null). Si el usuario dice \"departamento en santiago\", devuelve {\"comuna\":\"Santiago\",\"dormitorios\":null,\"banos\":null,\"sqm\":null}. Historial:\\n' + $('Lead Resolver').item.json.history + '\\nUsuario: ' + $('Lead Resolver').item.json.user_input, format: 'json', stream: False }) }}",
        "options": {}
      },
      "id": "extract_params_llm", "name": "Extract Params LLM",
      "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.1,
      "position": [2300, 250]
    },
    {
      "parameters": {
        "functionCode": "const raw = $input.first().json.response || '{}';\nlet params = { comuna: null, dormitorios: null, banos: null, sqm: null };\ntry {\n  params = JSON.parse(raw);\n} catch(e) {}\nconst ctx = $('Lead Resolver').item.json;\nreturn [{ json: { params, user_id: ctx.user_id, chat_id: ctx.chat_id, user_input: ctx.user_input, history: ctx.history } }];"
      },
      "id": "parse_params", "name": "Parse Params",
      "type": "n8n-nodes-base.function", "typeVersion": 1,
      "position": [2500, 250]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ !!$json.params.comuna && !!$json.params.dormitorios }}",
              "value2": True
            }
          ]
        }
      },
      "id": "if_missing_info", "name": "IF Missing Info",
      "type": "n8n-nodes-base.if", "typeVersion": 1,
      "position": [2700, 250]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://host.docker.internal:11434/api/generate",
        "sendBody": True, "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ model: 'llama3.1:8b', prompt: 'Eres un agente inmobiliario. El usuario busca propiedad pero faltan datos clave para buscar. Sabemos: ' + JSON.stringify($json.params) + '. Haz UNA pregunta natural para averiguar lo que falta (comuna, cantidad de dormitorios o baños). Sé muy amable. Historial: ' + $json.history + '\\nUsuario: ' + $json.user_input, stream: False }) }}",
        "options": {}
      },
      "id": "ask_missing_info", "name": "Ask Missing Info",
      "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.1,
      "position": [2900, 350]
    },
    {
      "parameters": {
        "functionCode": "const rawReply = ($input.first().json.response || '¿En qué comuna y cuántos dormitorios buscas?').trim();\nconst ctx = $('Parse Params').item.json;\nreturn [{ json: { reply: rawReply, reply_db: rawReply.replace(/'/g, \"''\"), user_id: ctx.user_id, chat_id: ctx.chat_id } }];"
      },
      "id": "format_ask", "name": "Format Ask",
      "type": "n8n-nodes-base.function", "typeVersion": 1,
      "position": [3100, 350]
    }
]

wf['nodes'].extend(new_nodes)

# Update connections
del wf['connections']['IF Propiedad']['main'][0][0] # remove connection to Extract Keyword
wf['connections']['IF Propiedad']['main'][0].append({ "node": "Extract Params LLM", "type": "main", "index": 0 })

if 'Extract Keyword' in wf['connections']:
    del wf['connections']['Extract Keyword']

wf['connections']['Extract Params LLM'] = { "main": [[{ "node": "Parse Params", "type": "main", "index": 0 }]] }
wf['connections']['Parse Params'] = { "main": [[{ "node": "IF Missing Info", "type": "main", "index": 0 }]] }
wf['connections']['IF Missing Info'] = {
  "main": [
    [{ "node": "Query Properties", "type": "main", "index": 0 }], # True
    [{ "node": "Ask Missing Info", "type": "main", "index": 0 }]  # False
  ]
}
wf['connections']['Ask Missing Info'] = { "main": [[{ "node": "Format Ask", "type": "main", "index": 0 }]] }
wf['connections']['Format Ask'] = { "main": [[{ "node": "Save AI", "type": "main", "index": 0 }]] }

with open('workflow.json', 'w', encoding='utf-8') as f:
    json.dump(wf, f, indent=2, ensure_ascii=False)
