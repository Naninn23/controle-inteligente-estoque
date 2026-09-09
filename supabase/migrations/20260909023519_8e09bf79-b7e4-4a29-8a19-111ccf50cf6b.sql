
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','gerente','operador');
CREATE TYPE public.doc_tipo AS ENUM ('entrada','saida');
CREATE TYPE public.doc_status AS ENUM ('rascunho','confirmado','cancelado');
CREATE TYPE public.mov_tipo AS ENUM ('entrada','saida','ajuste');
CREATE TYPE public.inv_status AS ENUM ('aberto','finalizado','cancelado');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  nome text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.pode_gerenciar()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente')
$$;

CREATE POLICY "perfis visiveis para autenticados" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "usuario edita proprio perfil" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "usuario cria proprio perfil" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "papeis visiveis para autenticados" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- CATEGORIAS
CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  parent_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat select" ON public.categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "cat write" ON public.categorias FOR ALL TO authenticated USING (public.pode_gerenciar()) WITH CHECK (public.pode_gerenciar());

-- FORNECEDORES
CREATE TABLE public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  documento text,
  email text,
  telefone text,
  cidade text,
  uf text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forn select" ON public.fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "forn write" ON public.fornecedores FOR ALL TO authenticated USING (public.pode_gerenciar()) WITH CHECK (public.pode_gerenciar());

-- PRODUTOS
CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  unidade text NOT NULL DEFAULT 'UN',
  categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  fornecedor_id uuid REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  estoque_min numeric(14,3) NOT NULL DEFAULT 0,
  estoque_max numeric(14,3) NOT NULL DEFAULT 0,
  preco_venda numeric(14,2) NOT NULL DEFAULT 0,
  custo_medio numeric(14,4) NOT NULL DEFAULT 0,
  saldo numeric(14,3) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod select" ON public.produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "prod write" ON public.produtos FOR ALL TO authenticated USING (public.pode_gerenciar()) WITH CHECK (public.pode_gerenciar());

-- DOCUMENTOS
CREATE SEQUENCE public.documento_numero_seq;
CREATE TABLE public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero bigint NOT NULL DEFAULT nextval('public.documento_numero_seq'),
  tipo public.doc_tipo NOT NULL,
  status public.doc_status NOT NULL DEFAULT 'rascunho',
  fornecedor_id uuid REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  destino text,
  observacao text,
  total numeric(14,2) NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmado_em timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos TO authenticated;
GRANT ALL ON public.documentos TO service_role;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc select" ON public.documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "doc insert" ON public.documentos FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "doc update" ON public.documentos FOR UPDATE TO authenticated USING (status = 'rascunho') WITH CHECK (true);
CREATE POLICY "doc delete" ON public.documentos FOR DELETE TO authenticated USING (status = 'rascunho');

CREATE TABLE public.documento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
  quantidade numeric(14,3) NOT NULL CHECK (quantidade > 0),
  valor_unitario numeric(14,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documento_itens TO authenticated;
GRANT ALL ON public.documento_itens TO service_role;
ALTER TABLE public.documento_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "item select" ON public.documento_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "item write" ON public.documento_itens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.documentos d WHERE d.id = documento_id AND d.status = 'rascunho'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.documentos d WHERE d.id = documento_id AND d.status = 'rascunho'));

-- MOVIMENTOS (imutáveis)
CREATE TABLE public.movimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
  tipo public.mov_tipo NOT NULL,
  quantidade numeric(14,3) NOT NULL,
  saldo_anterior numeric(14,3) NOT NULL,
  saldo_posterior numeric(14,3) NOT NULL,
  custo_unitario numeric(14,4) NOT NULL DEFAULT 0,
  custo_medio_anterior numeric(14,4) NOT NULL DEFAULT 0,
  custo_medio_posterior numeric(14,4) NOT NULL DEFAULT 0,
  documento_id uuid REFERENCES public.documentos(id) ON DELETE SET NULL,
  inventario_id uuid,
  origem text NOT NULL DEFAULT 'documento',
  observacao text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.movimentos TO authenticated;
GRANT ALL ON public.movimentos TO service_role;
ALTER TABLE public.movimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mov select" ON public.movimentos FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.bloquear_alteracao_movimento()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'Movimentações de estoque são imutáveis e não podem ser alteradas ou excluídas.';
END;
$$;
CREATE TRIGGER trg_mov_imutavel BEFORE UPDATE OR DELETE ON public.movimentos
FOR EACH ROW EXECUTE FUNCTION public.bloquear_alteracao_movimento();

-- INVENTARIOS
CREATE TABLE public.inventarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL DEFAULT 'Inventário',
  status public.inv_status NOT NULL DEFAULT 'aberto',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  finalizado_em timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventarios TO authenticated;
GRANT ALL ON public.inventarios TO service_role;
ALTER TABLE public.inventarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv select" ON public.inventarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "inv write" ON public.inventarios FOR ALL TO authenticated USING (public.pode_gerenciar()) WITH CHECK (public.pode_gerenciar());

CREATE TABLE public.inventario_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventario_id uuid NOT NULL REFERENCES public.inventarios(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
  saldo_sistema numeric(14,3) NOT NULL DEFAULT 0,
  saldo_contado numeric(14,3),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (inventario_id, produto_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventario_itens TO authenticated;
GRANT ALL ON public.inventario_itens TO service_role;
ALTER TABLE public.inventario_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invit select" ON public.inventario_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "invit write" ON public.inventario_itens FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- AUDITORIA
CREATE TABLE public.auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela text NOT NULL,
  registro_id uuid,
  acao text NOT NULL,
  dados_anteriores jsonb,
  dados_novos jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.auditoria TO authenticated;
GRANT ALL ON public.auditoria TO service_role;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aud select" ON public.auditoria FOR SELECT TO authenticated USING (public.pode_gerenciar());

CREATE OR REPLACE FUNCTION public.registrar_auditoria()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN v_id := OLD.id; ELSE v_id := NEW.id; END IF;
  INSERT INTO public.auditoria (tabela, registro_id, acao, dados_anteriores, dados_novos, user_id)
  VALUES (TG_TABLE_NAME, v_id, TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    auth.uid());
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_aud_produtos AFTER INSERT OR UPDATE OR DELETE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_categorias AFTER INSERT OR UPDATE OR DELETE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_fornecedores AFTER INSERT OR UPDATE OR DELETE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_documentos AFTER INSERT OR UPDATE OR DELETE ON public.documentos FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_inventarios AFTER INSERT OR UPDATE OR DELETE ON public.inventarios FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

-- CONFIGURACOES
CREATE TABLE public.configuracoes (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  empresa_nome text NOT NULL DEFAULT 'Minha Empresa',
  moeda text NOT NULL DEFAULT 'BRL',
  permitir_estoque_negativo boolean NOT NULL DEFAULT false,
  alerta_estoque_baixo boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cfg select" ON public.configuracoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "cfg write" ON public.configuracoes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.configuracoes (id) VALUES (true);

-- PERFIL + PAPEL INICIAL
CREATE OR REPLACE FUNCTION public.garantir_perfil(_nome text, _email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_count int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  INSERT INTO public.profiles (id, nome, email) VALUES (v_uid, COALESCE(NULLIF(_nome,''),_email), _email)
  ON CONFLICT (id) DO UPDATE SET nome = COALESCE(NULLIF(EXCLUDED.nome,''), public.profiles.nome);
  SELECT count(*) INTO v_count FROM public.user_roles;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, CASE WHEN v_count = 0 THEN 'admin'::public.app_role ELSE 'operador'::public.app_role END);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.definir_papel(_user_id uuid, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Apenas administradores podem alterar permissões'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
  INSERT INTO public.auditoria (tabela, registro_id, acao, dados_novos, user_id)
  VALUES ('user_roles', _user_id, 'UPDATE', jsonb_build_object('role', _role), auth.uid());
END;
$$;

-- CONFIRMAR DOCUMENTO (transacional, custo médio ponderado)
CREATE OR REPLACE FUNCTION public.confirmar_documento(_documento_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d public.documentos%ROWTYPE;
  it RECORD;
  p public.produtos%ROWTYPE;
  v_novo_saldo numeric(14,3);
  v_novo_custo numeric(14,4);
  v_permite_neg boolean;
  v_total numeric(14,2) := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO d FROM public.documentos WHERE id = _documento_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Documento não encontrado'; END IF;
  IF d.status <> 'rascunho' THEN RAISE EXCEPTION 'Documento já foi % ', d.status; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.documento_itens WHERE documento_id = _documento_id) THEN
    RAISE EXCEPTION 'Adicione pelo menos um item antes de confirmar';
  END IF;
  SELECT permitir_estoque_negativo INTO v_permite_neg FROM public.configuracoes WHERE id;

  FOR it IN SELECT * FROM public.documento_itens WHERE documento_id = _documento_id ORDER BY created_at LOOP
    SELECT * INTO p FROM public.produtos WHERE id = it.produto_id FOR UPDATE;
    IF d.tipo = 'entrada' THEN
      v_novo_saldo := p.saldo + it.quantidade;
      IF v_novo_saldo > 0 THEN
        v_novo_custo := ((GREATEST(p.saldo,0) * p.custo_medio) + (it.quantidade * it.valor_unitario)) / (GREATEST(p.saldo,0) + it.quantidade);
      ELSE
        v_novo_custo := it.valor_unitario;
      END IF;
      v_total := v_total + (it.quantidade * it.valor_unitario);
    ELSE
      v_novo_saldo := p.saldo - it.quantidade;
      IF v_novo_saldo < 0 AND NOT COALESCE(v_permite_neg,false) THEN
        RAISE EXCEPTION 'Estoque insuficiente para % (saldo %, saída %)', p.nome, p.saldo, it.quantidade;
      END IF;
      v_novo_custo := p.custo_medio;
      v_total := v_total + (it.quantidade * it.valor_unitario);
    END IF;

    INSERT INTO public.movimentos (produto_id, tipo, quantidade, saldo_anterior, saldo_posterior,
      custo_unitario, custo_medio_anterior, custo_medio_posterior, documento_id, origem, created_by)
    VALUES (p.id, d.tipo::text::public.mov_tipo, it.quantidade, p.saldo, v_novo_saldo,
      it.valor_unitario, p.custo_medio, v_novo_custo, d.id, 'documento', auth.uid());

    UPDATE public.produtos SET saldo = v_novo_saldo, custo_medio = v_novo_custo WHERE id = p.id;
  END LOOP;

  UPDATE public.documentos SET status = 'confirmado', confirmado_em = now(), total = v_total WHERE id = _documento_id;
END;
$$;

-- FINALIZAR INVENTARIO (gera ajustes)
CREATE OR REPLACE FUNCTION public.finalizar_inventario(_inventario_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.inventarios%ROWTYPE;
  it RECORD;
  p public.produtos%ROWTYPE;
BEGIN
  IF NOT public.pode_gerenciar() THEN RAISE EXCEPTION 'Sem permissão para finalizar inventário'; END IF;
  SELECT * INTO inv FROM public.inventarios WHERE id = _inventario_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inventário não encontrado'; END IF;
  IF inv.status <> 'aberto' THEN RAISE EXCEPTION 'Inventário já finalizado'; END IF;

  FOR it IN SELECT * FROM public.inventario_itens WHERE inventario_id = _inventario_id AND saldo_contado IS NOT NULL LOOP
    SELECT * INTO p FROM public.produtos WHERE id = it.produto_id FOR UPDATE;
    IF it.saldo_contado <> p.saldo THEN
      INSERT INTO public.movimentos (produto_id, tipo, quantidade, saldo_anterior, saldo_posterior,
        custo_unitario, custo_medio_anterior, custo_medio_posterior, inventario_id, origem, observacao, created_by)
      VALUES (p.id, 'ajuste', it.saldo_contado - p.saldo, p.saldo, it.saldo_contado,
        p.custo_medio, p.custo_medio, p.custo_medio, inv.id, 'inventario', inv.descricao, auth.uid());
      UPDATE public.produtos SET saldo = it.saldo_contado WHERE id = p.id;
    END IF;
  END LOOP;

  UPDATE public.inventarios SET status = 'finalizado', finalizado_em = now() WHERE id = _inventario_id;
END;
$$;
