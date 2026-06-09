CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_value_is_object CHECK (jsonb_typeof(value) IN ('object', 'array'))
);

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_data_is_object CHECK (jsonb_typeof(data) = 'object')
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at);
CREATE INDEX IF NOT EXISTS orders_data_gin_idx ON orders USING gin (data);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_settings_set_updated_at ON app_settings;
CREATE TRIGGER app_settings_set_updated_at
BEFORE UPDATE ON app_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

INSERT INTO app_settings (key, value)
VALUES
(
  'event_config',
  '{
    "date": "Sábado, dia 13",
    "time": "19:30",
    "location": "Sede da Manancial - Salão de Eventos",
    "matchText": "Brasil vs Marrocos",
    "pixKey": "stcaioaug@gmail.com",
    "pixReceiver": "Janaina",
    "whatsContact": "5511999999999",
    "whatsMessage": "Oi Janaina! Aqui está o comprovante do Pix para a Copa Manancial de {nome}. Valor: {valor}"
  }'::jsonb
),
(
  'ingredients',
  '[
    {"id":"pao","name":"Pão de Brioche","emoji":"🍞","cost":1.5,"isDefault":true,"category":"base"},
    {"id":"hamburguer","name":"Hambúrguer Gourmet","emoji":"🍔","cost":3,"isDefault":true,"category":"protein"},
    {"id":"queijo","name":"Queijo Mussarela","emoji":"🧀","cost":1.2,"isDefault":true,"category":"protein"},
    {"id":"ovo","name":"Ovo Frito","emoji":"🍳","cost":0.8,"isDefault":false,"category":"protein"},
    {"id":"bacon","name":"Bacon Crocante","emoji":"🥓","cost":2,"isDefault":false,"category":"protein"},
    {"id":"calabresa","name":"Calabresa Defumada","emoji":"🍕","cost":1.5,"isDefault":false,"category":"protein"},
    {"id":"alface","name":"Alface Fresca","emoji":"🥬","cost":0.3,"isDefault":false,"category":"salad"},
    {"id":"tomate","name":"Tomate Laminado","emoji":"🍅","cost":0.5,"isDefault":false,"category":"salad"},
    {"id":"rucula","name":"Rúcula Silvestre","emoji":"🌿","cost":0.45,"isDefault":false,"category":"salad"},
    {"id":"maionese","name":"Maionese Artesanal","emoji":"💛","cost":0.4,"isDefault":false,"category":"sauce"},
    {"id":"ketchup","name":"Ketchup Heinz","emoji":"❤️","cost":0.4,"isDefault":false,"category":"sauce"}
  ]'::jsonb
)
ON CONFLICT (key) DO NOTHING;
