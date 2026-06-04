--
-- PostgreSQL database dump
--

\restrict 1tZVdc6vmkoDKZvkPUvC4FZ7nxED1e6ewVFJxQ4gABVR775l8oGoO2HW8QIC8U8

-- Dumped from database version 15.18 (Debian 15.18-1.pgdg13+1)
-- Dumped by pg_dump version 15.18 (Debian 15.18-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: FlowType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FlowType" AS ENUM (
    'INFLOW',
    'OUTFLOW'
);


ALTER TYPE public."FlowType" OWNER TO postgres;

--
-- Name: ReceivableDirection; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReceivableDirection" AS ENUM (
    'I_OWE_THEM',
    'THEY_OWE_ME'
);


ALTER TYPE public."ReceivableDirection" OWNER TO postgres;

--
-- Name: ReceivableStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReceivableStatus" AS ENUM (
    'PENDING',
    'PARTIAL',
    'SETTLED',
    'WRITTEN_OFF'
);


ALTER TYPE public."ReceivableStatus" OWNER TO postgres;

--
-- Name: TransactionCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransactionCategory" AS ENUM (
    'TRANSPORT',
    'FOOD',
    'UTILITIES',
    'ENTERTAINMENT',
    'HEALTH',
    'EDUCATION',
    'SHOPPING',
    'WASTED',
    'SALARY',
    'FREELANCE',
    'GIFT',
    'RECHARGE',
    'REBATE',
    'OTHER'
);


ALTER TYPE public."TransactionCategory" OWNER TO postgres;

--
-- Name: WalletType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WalletType" AS ENUM (
    'BANK',
    'CASH',
    'MOMO',
    'RECEIVABLE'
);


ALTER TYPE public."WalletType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: cash_flows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cash_flows (
    id text NOT NULL,
    type public."FlowType" NOT NULL,
    amount numeric(15,2) NOT NULL,
    category public."TransactionCategory" DEFAULT 'OTHER'::public."TransactionCategory" NOT NULL,
    description text NOT NULL,
    "walletId" text NOT NULL,
    "expenseId" text,
    "transportRechargeId" text,
    "receivablePaymentId" text,
    "wastedMoneyId" text,
    "occurredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public.cash_flows OWNER TO postgres;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    id text NOT NULL,
    "jobTitle" text NOT NULL,
    employer text NOT NULL,
    "salaryAmount" numeric(15,2) NOT NULL,
    currency text DEFAULT 'RWF'::text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id text NOT NULL,
    title text NOT NULL,
    amount numeric(15,2) NOT NULL,
    category public."TransactionCategory" DEFAULT 'OTHER'::public."TransactionCategory" NOT NULL,
    "walletId" text NOT NULL,
    note text,
    "spentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: receivable_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.receivable_payments (
    id text NOT NULL,
    "receivableId" text NOT NULL,
    "walletId" text,
    amount numeric(15,2) NOT NULL,
    note text,
    "paidAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.receivable_payments OWNER TO postgres;

--
-- Name: receivables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.receivables (
    id text NOT NULL,
    "personName" text NOT NULL,
    "phoneNumber" text,
    direction public."ReceivableDirection" NOT NULL,
    "originalAmount" numeric(15,2) NOT NULL,
    "paidAmount" numeric(15,2) DEFAULT 0 NOT NULL,
    "remainingAmount" numeric(15,2) NOT NULL,
    currency text DEFAULT 'RWF'::text NOT NULL,
    status public."ReceivableStatus" DEFAULT 'PENDING'::public."ReceivableStatus" NOT NULL,
    reason text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public.receivables OWNER TO postgres;

--
-- Name: transport_cards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transport_cards (
    id text NOT NULL,
    name text DEFAULT 'Transport Card'::text NOT NULL,
    balance numeric(15,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public.transport_cards OWNER TO postgres;

--
-- Name: transport_recharges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transport_recharges (
    id text NOT NULL,
    "cardId" text NOT NULL,
    amount numeric(15,2) NOT NULL,
    "walletId" text NOT NULL,
    note text,
    "rechargedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.transport_recharges OWNER TO postgres;

--
-- Name: transport_usages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transport_usages (
    id text NOT NULL,
    "cardId" text NOT NULL,
    amount numeric(15,2) NOT NULL,
    route text,
    note text,
    "usedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.transport_usages OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    "phoneNumber" text,
    password text NOT NULL,
    name text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    id text NOT NULL,
    name text NOT NULL,
    type public."WalletType" NOT NULL,
    balance numeric(15,2) DEFAULT 0 NOT NULL,
    currency text DEFAULT 'RWF'::text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Name: wasted_money; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wasted_money (
    id text NOT NULL,
    amount numeric(15,2) NOT NULL,
    reason text NOT NULL,
    "keyTakeaway" text NOT NULL,
    "walletId" text NOT NULL,
    "wastedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public.wasted_money OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ba84ef62-70a9-4074-a3e1-6b07b9d341c4	3f8fdcd4d6f6c36260eb84c8b3d4001643067d5fe3e7d0bb120d44fc98d77fda	2026-06-02 08:19:02.131336+00	20260602081901_init	\N	\N	2026-06-02 08:19:01.779587+00	1
968cc76c-eccd-4700-81d4-2472c053b064	c16bc2e64b2cd326c696e62249ee8be8133dcbdb9ae7d90af6e3fce47f2d990b	2026-06-02 09:41:19.597672+00	20260602094119_add_user_relations	\N	\N	2026-06-02 09:41:19.453729+00	1
\.


--
-- Data for Name: cash_flows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cash_flows (id, type, amount, category, description, "walletId", "expenseId", "transportRechargeId", "receivablePaymentId", "wastedMoneyId", "occurredAt", "createdAt", "userId") FROM stdin;
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contracts (id, "jobTitle", employer, "salaryAmount", currency, "startDate", "endDate", "isActive", note, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, title, amount, category, "walletId", note, "spentAt", "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: receivable_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.receivable_payments (id, "receivableId", "walletId", amount, note, "paidAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: receivables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.receivables (id, "personName", "phoneNumber", direction, "originalAmount", "paidAmount", "remainingAmount", currency, status, reason, "dueDate", note, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: transport_cards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transport_cards (id, name, balance, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: transport_recharges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transport_recharges (id, "cardId", amount, "walletId", note, "rechargedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: transport_usages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transport_usages (id, "cardId", amount, route, note, "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, "phoneNumber", password, name, "createdAt", "updatedAt") FROM stdin;
cmpwpcai50000bgfj5wa72pph	habimanatonyherve@gmail.com	0790732408	$2b$10$eOADIXyp0Jj.v9l6njrkquHGEg/o4lvn.OG8AMDYk5ydRNWz9AjHe	tony_00	2026-06-02 13:57:30.03	2026-06-02 13:57:30.03
cmpwpow9t000088fjvhfu9dns	munyanezacelia3@gmail.com	0786474621	$2b$10$jXAMxKiIjTx3JwGG07Ts7O5Y.0cNdwa9784Ig4DHyaHfeEbEBWIkm	celia_ineza	2026-06-02 14:07:18.114	2026-06-02 14:07:18.114
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallets (id, name, type, balance, currency, description, "isActive", "createdAt", "updatedAt", "userId") FROM stdin;
cmpx5vv17000004fj3446loqh	MTN MoMo_255	MOMO	3000.00	RWF	The MTN MoMo Account register on 0796611255(registered on me)	t	2026-06-02 21:40:36.957	2026-06-03 08:31:53.106	cmpwpcai50000bgfj5wa72pph
\.


--
-- Data for Name: wasted_money; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wasted_money (id, amount, reason, "keyTakeaway", "walletId", "wastedAt", "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: cash_flows cash_flows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_flows
    ADD CONSTRAINT cash_flows_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: receivable_payments receivable_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receivable_payments
    ADD CONSTRAINT receivable_payments_pkey PRIMARY KEY (id);


--
-- Name: receivables receivables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receivables
    ADD CONSTRAINT receivables_pkey PRIMARY KEY (id);


--
-- Name: transport_cards transport_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transport_cards
    ADD CONSTRAINT transport_cards_pkey PRIMARY KEY (id);


--
-- Name: transport_recharges transport_recharges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transport_recharges
    ADD CONSTRAINT transport_recharges_pkey PRIMARY KEY (id);


--
-- Name: transport_usages transport_usages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transport_usages
    ADD CONSTRAINT transport_usages_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wasted_money wasted_money_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wasted_money
    ADD CONSTRAINT wasted_money_pkey PRIMARY KEY (id);


--
-- Name: cash_flows_expenseId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "cash_flows_expenseId_key" ON public.cash_flows USING btree ("expenseId");


--
-- Name: cash_flows_receivablePaymentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "cash_flows_receivablePaymentId_key" ON public.cash_flows USING btree ("receivablePaymentId");


--
-- Name: cash_flows_transportRechargeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "cash_flows_transportRechargeId_key" ON public.cash_flows USING btree ("transportRechargeId");


--
-- Name: cash_flows_wastedMoneyId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "cash_flows_wastedMoneyId_key" ON public.cash_flows USING btree ("wastedMoneyId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: cash_flows cash_flows_expenseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_flows
    ADD CONSTRAINT "cash_flows_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES public.expenses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cash_flows cash_flows_receivablePaymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_flows
    ADD CONSTRAINT "cash_flows_receivablePaymentId_fkey" FOREIGN KEY ("receivablePaymentId") REFERENCES public.receivable_payments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cash_flows cash_flows_transportRechargeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_flows
    ADD CONSTRAINT "cash_flows_transportRechargeId_fkey" FOREIGN KEY ("transportRechargeId") REFERENCES public.transport_recharges(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cash_flows cash_flows_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_flows
    ADD CONSTRAINT "cash_flows_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cash_flows cash_flows_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_flows
    ADD CONSTRAINT "cash_flows_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public.wallets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cash_flows cash_flows_wastedMoneyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_flows
    ADD CONSTRAINT "cash_flows_wastedMoneyId_fkey" FOREIGN KEY ("wastedMoneyId") REFERENCES public.wasted_money(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contracts contracts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "contracts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expenses expenses_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expenses expenses_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "expenses_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public.wallets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: receivable_payments receivable_payments_receivableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receivable_payments
    ADD CONSTRAINT "receivable_payments_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES public.receivables(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: receivable_payments receivable_payments_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receivable_payments
    ADD CONSTRAINT "receivable_payments_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public.wallets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: receivables receivables_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receivables
    ADD CONSTRAINT "receivables_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transport_cards transport_cards_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transport_cards
    ADD CONSTRAINT "transport_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transport_recharges transport_recharges_cardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transport_recharges
    ADD CONSTRAINT "transport_recharges_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES public.transport_cards(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transport_recharges transport_recharges_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transport_recharges
    ADD CONSTRAINT "transport_recharges_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public.wallets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transport_usages transport_usages_cardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transport_usages
    ADD CONSTRAINT "transport_usages_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES public.transport_cards(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: wallets wallets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: wasted_money wasted_money_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wasted_money
    ADD CONSTRAINT "wasted_money_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: wasted_money wasted_money_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wasted_money
    ADD CONSTRAINT "wasted_money_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public.wallets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 1tZVdc6vmkoDKZvkPUvC4FZ7nxED1e6ewVFJxQ4gABVR775l8oGoO2HW8QIC8U8

