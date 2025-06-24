--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PAID',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: SampleFormat; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SampleFormat" AS ENUM (
    'WAV',
    'STEMS',
    'MIDI'
);


ALTER TYPE public."SampleFormat" OWNER TO postgres;

--
-- Name: SampleKind; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SampleKind" AS ENUM (
    'LOOP',
    'ONESHOT',
    'DRUMKIT',
    'PRESET',
    'MIDI',
    'STEM',
    'TEMPLATE',
    'SOUNDKIT'
);


ALTER TYPE public."SampleKind" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'CREATOR',
    'ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'BANNED'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Sample; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Sample" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "fileUrl" text NOT NULL,
    "waveformData" text,
    duration double precision NOT NULL,
    bpm integer,
    key text,
    tags text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "hasMidi" boolean DEFAULT false NOT NULL,
    "hasStems" boolean DEFAULT false NOT NULL,
    "hasWav" boolean DEFAULT true NOT NULL,
    "midiPrice" double precision,
    "stemsPrice" double precision,
    "wavPrice" double precision,
    "bitDepth" integer DEFAULT 16 NOT NULL,
    channels integer DEFAULT 2 NOT NULL,
    format text DEFAULT 'wav'::text NOT NULL,
    "peakAmplitude" double precision,
    "sampleRate" integer DEFAULT 44100 NOT NULL,
    "samplePackId" integer NOT NULL
);


ALTER TABLE public."Sample" OWNER TO postgres;

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
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id text NOT NULL,
    "cartId" text NOT NULL,
    "sampleId" text,
    format public."SampleFormat" NOT NULL,
    price double precision NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "samplePackId" integer
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carts (
    id text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.carts OWNER TO postgres;

--
-- Name: creators; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.creators (
    id text NOT NULL,
    "userId" text NOT NULL,
    bio text,
    website text,
    socials jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "stripeAccountId" text,
    "payoutEnabled" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.creators OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "sampleId" text,
    price double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "samplePackId" integer
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "userId" text NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "totalAmount" double precision NOT NULL,
    "paymentIntent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: sample_packs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sample_packs (
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    price double precision DEFAULT 0 NOT NULL,
    "coverImage" text NOT NULL,
    "creatorId" text NOT NULL,
    published boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    archived boolean DEFAULT false NOT NULL,
    "archivedAt" timestamp(3) without time zone,
    "publishedAt" timestamp(3) without time zone,
    category text DEFAULT 'sample-pack'::text NOT NULL,
    uuid text NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.sample_packs OWNER TO postgres;

--
-- Name: sample_packs_new_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sample_packs_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sample_packs_new_id_seq OWNER TO postgres;

--
-- Name: sample_packs_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sample_packs_new_id_seq OWNED BY public.sample_packs.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text,
    email text,
    "emailVerified" timestamp(3) without time zone,
    image text,
    password text,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isCreator" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.verification_tokens OWNER TO postgres;

--
-- Name: sample_packs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sample_packs ALTER COLUMN id SET DEFAULT nextval('public.sample_packs_new_id_seq'::regclass);


--
-- Data for Name: Sample; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Sample" (id, title, description, "fileUrl", "waveformData", duration, bpm, key, tags, "createdAt", "updatedAt", "hasMidi", "hasStems", "hasWav", "midiPrice", "stemsPrice", "wavPrice", "bitDepth", channels, format, "peakAmplitude", "sampleRate", "samplePackId") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4bac66bb-bcf6-4e67-8e97-6d802b7d71e5	ac1a57816f773866fe988bf7a199f58ee7c8bc8ec1e0370662022b6ae2d2c743	2025-02-12 20:48:32.548115+01	20250212112819_init	\N	\N	2025-02-12 20:48:32.50574+01	1
d1251ead-9ed4-4b64-a123-81ad26503b3a	d1796bd9d97cdc974225a281a1f5aa93c7523ee2d407c7ae91ce58f28947c4e8	2025-02-12 20:48:32.570271+01	20250212173240_add_slug_to_sample_pack	\N	\N	2025-02-12 20:48:32.548571+01	1
cd6ee246-2f43-4704-9601-24876de6cadf	48557faf421bcbcc3ab7d3c2b92d4a01b91395fdfb7ba42eb0204c2b5f2479c2	2025-02-12 20:48:33.505908+01	20250212194833_add_pack_state_fields	\N	\N	2025-02-12 20:48:33.503804+01	1
d84b2e38-e216-417d-b7aa-7a6c8d7996d8	f93b6f69b99f4620d85f8b3b4bc4e050f49d5afdcb42b5ca7f2c5103eae60a04	2025-02-12 21:26:51.050678+01	20250212202651_simplify_sample_pack_schema	\N	\N	2025-02-12 21:26:51.044911+01	1
8fab6fd9-fe22-4582-b77f-c4bbf4fdc94c	16e7ad2ca32e50ca19cf1cb9bf65a8605d9dda3f98e7e6ff23ba5338874eceeb	2025-02-12 21:32:51.595337+01	20250212203251_add_sample_file_types	\N	\N	2025-02-12 21:32:51.592122+01	1
082a7cb8-68e2-4fb5-9995-9e0c24ae690a	b6760a739860601bebaf4bc2d3503fc67f632e0dce3b303458b2c2cdec787b9c	2025-02-12 22:50:50.05277+01	20250212215000_numeric_pack_ids	\N	\N	2025-02-12 22:50:50.024224+01	1
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (id, "cartId", "sampleId", format, price, quantity, "createdAt", "updatedAt", "samplePackId") FROM stdin;
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carts (id, "userId", "createdAt", "updatedAt") FROM stdin;
cm72cpxlv0006cdk8e0kqwdrk	cm72cpx1u0004cdk8w2vh1p8k	2025-02-12 20:16:24.164	2025-02-12 20:16:24.164
cm72e4a8c0004cdxgpjlqtoji	cm72e4a2g0002cdxgtlwf7v7y	2025-02-12 20:55:33.325	2025-02-12 20:55:33.325
\.


--
-- Data for Name: creators; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.creators (id, "userId", bio, website, socials, "createdAt", "updatedAt", "isVerified", "stripeAccountId", "payoutEnabled") FROM stdin;
cm72edccp0001cd8ow4v0a621	cm72cpx1u0004cdk8w2vh1p8k	Creator profile	\N	\N	2025-02-12 21:02:35.978	2025-02-12 21:02:35.978	f	\N	f
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, "orderId", "sampleId", price, "createdAt", "samplePackId") FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, "userId", status, "totalAmount", "paymentIntent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sample_packs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sample_packs (title, slug, description, price, "coverImage", "creatorId", published, "createdAt", "updatedAt", archived, "archivedAt", "publishedAt", category, uuid, id) FROM stdin;
azwoijuheazijhgweazjklghbewhjklazeaz	azwoijuheazijhgweazjklghbewhjklazeaz	weazjkhweazjkhlwejklhazjklwheaz	0	/uploads/images/33eb1d89-303d-4910-a182-2cd22730c924.jpg	cm72edccp0001cd8ow4v0a621	f	2025-02-12 23:02:57.215	2025-02-12 23:02:57.215	f	\N	\N	sample-pack	cm72io4an0001cd24nsn9b8p0	7
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, "emailVerified", image, password, role, status, "createdAt", "updatedAt", "isCreator") FROM stdin;
cm72e4a2g0002cdxgtlwf7v7y	\N	kriocod@gmail.com	\N	\N	$2a$10$0EKVnzfXdr82lVwxMquueevdhM3QB3rJIyLK4NYOyfsu6w224lxii	USER	ACTIVE	2025-02-12 20:55:33.112	2025-02-12 20:55:33.112	f
cm72cpx1u0004cdk8w2vh1p8k	\N	jeremymastering@gmail.com	\N	\N	$2a$10$AWHerOsPIg7CcPuJ0ar3pOYm653C4vwnW2MIEhaWQwGVif1oLwzH.	CREATOR	ACTIVE	2025-02-12 20:16:23.443	2025-02-12 21:02:35.973	t
\.


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification_tokens (identifier, token, expires) FROM stdin;
\.


--
-- Name: sample_packs_new_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sample_packs_new_id_seq', 7, true);


--
-- Name: Sample Sample_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sample"
    ADD CONSTRAINT "Sample_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: creators creators_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creators
    ADD CONSTRAINT creators_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: sample_packs sample_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sample_packs
    ADD CONSTRAINT sample_packs_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: Sample_samplePackId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sample_samplePackId_idx" ON public."Sample" USING btree ("samplePackId");


--
-- Name: accounts_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON public.accounts USING btree (provider, "providerAccountId");


--
-- Name: carts_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "carts_userId_key" ON public.carts USING btree ("userId");


--
-- Name: creators_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "creators_userId_key" ON public.creators USING btree ("userId");


--
-- Name: sample_packs_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sample_packs_slug_key ON public.sample_packs USING btree (slug);


--
-- Name: sample_packs_uuid_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sample_packs_uuid_key ON public.sample_packs USING btree (uuid);


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: verification_tokens_identifier_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verification_tokens_identifier_token_key ON public.verification_tokens USING btree (identifier, token);


--
-- Name: verification_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verification_tokens_token_key ON public.verification_tokens USING btree (token);


--
-- Name: Sample Sample_samplePackId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sample"
    ADD CONSTRAINT "Sample_samplePackId_fkey" FOREIGN KEY ("samplePackId") REFERENCES public.sample_packs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_sampleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES public."Sample"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cart_items cart_items_samplePackId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_samplePackId_fkey" FOREIGN KEY ("samplePackId") REFERENCES public.sample_packs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: carts carts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: creators creators_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creators
    ADD CONSTRAINT "creators_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_sampleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES public."Sample"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_items order_items_samplePackId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_samplePackId_fkey" FOREIGN KEY ("samplePackId") REFERENCES public.sample_packs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sample_packs sample_packs_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sample_packs
    ADD CONSTRAINT "sample_packs_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public.creators(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

