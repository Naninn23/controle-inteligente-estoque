
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS localizacao text;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS codigo_barras text;

DO $seed$
DECLARE
  c_bebidas uuid; c_alim uuid; c_limp uuid; c_papel uuid; c_elet uuid; c_emb uuid;
  f1 uuid; f2 uuid; f3 uuid; f4 uuid;
  p RECORD;
  v_saldo numeric; v_cm numeric; v_ant numeric; v_cm_ant numeric;
  q numeric; cu numeric; d int; ts timestamptz; base numeric;
BEGIN
  IF (SELECT count(*) FROM public.produtos) > 0 THEN RETURN; END IF;

  INSERT INTO public.categorias (nome, descricao) VALUES ('Bebidas','Bebidas em geral') RETURNING id INTO c_bebidas;
  INSERT INTO public.categorias (nome, descricao) VALUES ('Alimentos','Alimentos e mercearia') RETURNING id INTO c_alim;
  INSERT INTO public.categorias (nome, descricao) VALUES ('Limpeza','Produtos de limpeza') RETURNING id INTO c_limp;
  INSERT INTO public.categorias (nome, descricao) VALUES ('Papelaria','Material de escritório') RETURNING id INTO c_papel;
  INSERT INTO public.categorias (nome, descricao) VALUES ('Eletrônicos','Acessórios e eletrônicos') RETURNING id INTO c_elet;
  INSERT INTO public.categorias (nome, descricao, parent_id) VALUES ('Embalagens','Caixas e sacolas', c_limp) RETURNING id INTO c_emb;

  INSERT INTO public.fornecedores (nome, documento, email, telefone, cidade, uf) VALUES
    ('Distribuidora Sol Ltda','12.345.678/0001-90','contato@sol.com.br','(11) 4002-8922','São Paulo','SP') RETURNING id INTO f1;
  INSERT INTO public.fornecedores (nome, documento, email, telefone, cidade, uf) VALUES
    ('Atacado Norte S.A.','98.765.432/0001-10','vendas@norte.com.br','(85) 3232-1100','Fortaleza','CE') RETURNING id INTO f2;
  INSERT INTO public.fornecedores (nome, documento, email, telefone, cidade, uf) VALUES
    ('Comercial Vale Verde','45.678.912/0001-33','comercial@valeverde.com.br','(31) 3555-7788','Belo Horizonte','MG') RETURNING id INTO f3;
  INSERT INTO public.fornecedores (nome, documento, email, telefone, cidade, uf) VALUES
    ('Tech Supply Brasil','77.888.999/0001-55','suporte@techsupply.com.br','(41) 3010-2020','Curitiba','PR') RETURNING id INTO f4;

  INSERT INTO public.produtos (sku, nome, descricao, unidade, categoria_id, fornecedor_id, estoque_min, estoque_max, preco_venda, localizacao, codigo_barras) VALUES
    ('BEB-0001','Água Mineral 500ml (fardo)','Fardo com 12 unidades','FD',c_bebidas,f1,20,200,32.90,'A-01-02','7891000000011'),
    ('BEB-0002','Refrigerante Cola 2L','Garrafa PET 2 litros','UN',c_bebidas,f1,40,400,8.49,'A-01-05','7891000000028'),
    ('BEB-0003','Café Torrado 500g','Pacote a vácuo','UN',c_bebidas,f3,30,300,18.90,'A-02-01','7891000000035'),
    ('ALI-0001','Arroz Tipo 1 5kg','Pacote 5kg','UN',c_alim,f2,25,250,27.50,'B-01-01','7892000000012'),
    ('ALI-0002','Feijão Carioca 1kg','Pacote 1kg','UN',c_alim,f2,30,300,9.20,'B-01-04','7892000000029'),
    ('ALI-0003','Óleo de Soja 900ml','Garrafa 900ml','UN',c_alim,f3,40,400,7.10,'B-02-02','7892000000036'),
    ('LIM-0001','Detergente Neutro 500ml','Frasco 500ml','UN',c_limp,f3,50,500,2.79,'C-01-01','7893000000015'),
    ('LIM-0002','Água Sanitária 1L','Frasco 1 litro','UN',c_limp,f3,40,400,4.99,'C-01-03','7893000000022'),
    ('LIM-0003','Papel Higiênico 12 rolos','Pacote com 12','PC',c_limp,f1,20,200,21.90,'C-02-01','7893000000039'),
    ('EMB-0001','Caixa Papelão 40x30','Caixa reforçada','UN',c_emb,f2,60,600,3.40,'D-01-01','7894000000018'),
    ('EMB-0002','Sacola Plástica 40x50 (cento)','Pacote com 100','PC',c_emb,f2,15,150,26.00,'D-01-04','7894000000025'),
    ('PAP-0001','Resma Papel A4 500 folhas','Papel sulfite branco','UN',c_papel,f4,20,200,29.90,'E-01-01','7895000000011'),
    ('PAP-0002','Caneta Esferográfica Azul (cx 50)','Caixa com 50','CX',c_papel,f4,10,100,64.00,'E-01-03','7895000000028'),
    ('ELE-0001','Cabo USB-C 1,5m','Cabo reforçado','UN',c_elet,f4,15,150,39.90,'F-01-02','7896000000014'),
    ('ELE-0002','Lâmpada LED 9W','Bulbo E27 branca','UN',c_elet,f4,25,250,12.50,'F-02-01','7896000000021'),
    ('ELE-0003','Pilha Alcalina AA (cartela 4)','Cartela com 4','CT',c_elet,f1,30,300,18.00,'F-02-04','7896000000038');

  FOR p IN SELECT * FROM public.produtos ORDER BY sku LOOP
    base := round((p.preco_venda * 0.62)::numeric, 2);
    v_saldo := 0; v_cm := 0;

    FOR d IN REVERSE 364..0 LOOP
      -- entradas periódicas
      IF (d % 30) = ((abs(hashtext(p.sku)) % 30)) THEN
        q := round((p.estoque_min * (2 + random() * 2))::numeric, 0);
        cu := round((base * (0.92 + random() * 0.22))::numeric, 2);
        v_ant := v_saldo; v_cm_ant := v_cm;
        v_saldo := v_ant + q;
        v_cm := round(((v_ant * v_cm_ant + q * cu) / v_saldo)::numeric, 4);
        ts := (now() - make_interval(days => d)) + make_interval(hours => 8 + floor(random() * 8)::int);
        INSERT INTO public.movimentos (produto_id, tipo, quantidade, saldo_anterior, saldo_posterior,
          custo_unitario, custo_medio_anterior, custo_medio_posterior, origem, observacao, created_at)
        VALUES (p.id, 'entrada', q, v_ant, v_saldo, cu, v_cm_ant, v_cm, 'demonstracao', 'Compra de reposição', ts);
      END IF;

      -- saídas frequentes
      IF random() < 0.45 AND v_saldo > 1 THEN
        q := least(round((p.estoque_min * (0.1 + random() * 0.35))::numeric, 0), floor(v_saldo));
        IF q >= 1 THEN
          v_ant := v_saldo; v_saldo := v_ant - q;
          ts := (now() - make_interval(days => d)) + make_interval(hours => 9 + floor(random() * 9)::int);
          INSERT INTO public.movimentos (produto_id, tipo, quantidade, saldo_anterior, saldo_posterior,
            custo_unitario, custo_medio_anterior, custo_medio_posterior, origem, observacao, created_at)
          VALUES (p.id, 'saida', q, v_ant, v_saldo, v_cm, v_cm, v_cm, 'demonstracao', 'Venda / consumo', ts);
        END IF;
      END IF;
    END LOOP;

    UPDATE public.produtos SET saldo = v_saldo, custo_medio = v_cm WHERE id = p.id;
  END LOOP;

  -- garante cenários de alerta e ruptura
  UPDATE public.produtos SET saldo = 0 WHERE sku = 'PAP-0002';
  UPDATE public.produtos SET saldo = greatest(estoque_min - 3, 0) WHERE sku IN ('LIM-0002','ELE-0001','BEB-0003');
END
$seed$;
