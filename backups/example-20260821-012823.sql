--
-- PostgreSQL database dump
--

\restrict 3bbxP6AwX0n4B09a4sGRLAYNYnzF7cAPl3RKt7zWhpcIqjR3voZ7jmUHQZ1PiOu

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

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

ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Socket" DROP CONSTRAINT IF EXISTS "Socket_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Socket" DROP CONSTRAINT IF EXISTS "Socket_deviceId_fkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."RefreshSession" DROP CONSTRAINT IF EXISTS "RefreshSession_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Planner" DROP CONSTRAINT IF EXISTS "Planner_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Planner" DROP CONSTRAINT IF EXISTS "Planner_budgetId_fkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_recipientId_fkey";
ALTER TABLE IF EXISTS ONLY public."Loan" DROP CONSTRAINT IF EXISTS "Loan_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Investment" DROP CONSTRAINT IF EXISTS "Investment_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Goal" DROP CONSTRAINT IF EXISTS "Goal_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."FailureLog" DROP CONSTRAINT IF EXISTS "FailureLog_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Device" DROP CONSTRAINT IF EXISTS "Device_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ConversationMessage" DROP CONSTRAINT IF EXISTS "ConversationMessage_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ConversationMessage" DROP CONSTRAINT IF EXISTS "ConversationMessage_conversationId_fkey";
ALTER TABLE IF EXISTS ONLY public."ConversationMessageStatus" DROP CONSTRAINT IF EXISTS "ConversationMessageStatus_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ConversationMessageStatus" DROP CONSTRAINT IF EXISTS "ConversationMessageStatus_conversationMessageId_fkey";
ALTER TABLE IF EXISTS ONLY public."ConversationMessageStatus" DROP CONSTRAINT IF EXISTS "ConversationMessageStatus_conversationId_fkey";
ALTER TABLE IF EXISTS ONLY public."ConversationMember" DROP CONSTRAINT IF EXISTS "ConversationMember_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ConversationMember" DROP CONSTRAINT IF EXISTS "ConversationMember_conversationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Contact" DROP CONSTRAINT IF EXISTS "Contact_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Contact" DROP CONSTRAINT IF EXISTS "Contact_conversationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Categories" DROP CONSTRAINT IF EXISTS "Categories_parentCode_fkey";
ALTER TABLE IF EXISTS ONLY public."Budget" DROP CONSTRAINT IF EXISTS "Budget_userId_fkey";
DROP INDEX IF EXISTS public."User_mobileNo_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."Transaction_userId_idx";
DROP INDEX IF EXISTS public."Tradingview_timestamp_idx";
DROP INDEX IF EXISTS public."Tradingview_symbol_idx";
DROP INDEX IF EXISTS public."Socket_userId_idx";
DROP INDEX IF EXISTS public."Socket_socketId_idx";
DROP INDEX IF EXISTS public."Socket_deviceId_idx";
DROP INDEX IF EXISTS public."Session_userId_idx";
DROP INDEX IF EXISTS public."RefreshSession_userId_idx";
DROP INDEX IF EXISTS public."Planner_userId_idx";
DROP INDEX IF EXISTS public."Planner_budgetId_idx";
DROP INDEX IF EXISTS public."Otp_mobileNo_type_idx";
DROP INDEX IF EXISTS public."Notification_recipientId_idx";
DROP INDEX IF EXISTS public."Loan_userId_idx";
DROP INDEX IF EXISTS public."Investment_userId_idx";
DROP INDEX IF EXISTS public."Goal_userId_idx";
DROP INDEX IF EXISTS public."FailureLog_userId_idx";
DROP INDEX IF EXISTS public."FailureLog_requestId_idx";
DROP INDEX IF EXISTS public."FailureLog_createdAt_idx";
DROP INDEX IF EXISTS public."Device_userId_idx";
DROP INDEX IF EXISTS public."ConversationMessage_userId_idx";
DROP INDEX IF EXISTS public."ConversationMessage_conversationId_idx";
DROP INDEX IF EXISTS public."ConversationMessageStatus_userId_idx";
DROP INDEX IF EXISTS public."ConversationMessageStatus_conversationMessageId_userId_type_key";
DROP INDEX IF EXISTS public."ConversationMessageStatus_conversationId_idx";
DROP INDEX IF EXISTS public."ConversationMember_userId_idx";
DROP INDEX IF EXISTS public."ConversationMember_conversationId_userId_key";
DROP INDEX IF EXISTS public."Contact_userId_idx";
DROP INDEX IF EXISTS public."Contact_mobileNo_idx";
DROP INDEX IF EXISTS public."Contact_conversationId_idx";
DROP INDEX IF EXISTS public."Constant_column_idx";
DROP INDEX IF EXISTS public."Constant_code_idx";
DROP INDEX IF EXISTS public."Categories_parentCode_idx";
DROP INDEX IF EXISTS public."Categories_code_key";
DROP INDEX IF EXISTS public."Budget_userId_idx";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_pkey";
ALTER TABLE IF EXISTS ONLY public."Tradingview" DROP CONSTRAINT IF EXISTS "Tradingview_pkey";
ALTER TABLE IF EXISTS ONLY public."Socket" DROP CONSTRAINT IF EXISTS "Socket_pkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_pkey";
ALTER TABLE IF EXISTS ONLY public."RefreshSession" DROP CONSTRAINT IF EXISTS "RefreshSession_pkey";
ALTER TABLE IF EXISTS ONLY public."Planner" DROP CONSTRAINT IF EXISTS "Planner_pkey";
ALTER TABLE IF EXISTS ONLY public."Otp" DROP CONSTRAINT IF EXISTS "Otp_pkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_pkey";
ALTER TABLE IF EXISTS ONLY public."Loan" DROP CONSTRAINT IF EXISTS "Loan_pkey";
ALTER TABLE IF EXISTS ONLY public."Investment" DROP CONSTRAINT IF EXISTS "Investment_pkey";
ALTER TABLE IF EXISTS ONLY public."Goal" DROP CONSTRAINT IF EXISTS "Goal_pkey";
ALTER TABLE IF EXISTS ONLY public."FailureLog" DROP CONSTRAINT IF EXISTS "FailureLog_pkey";
ALTER TABLE IF EXISTS ONLY public."Device" DROP CONSTRAINT IF EXISTS "Device_pkey";
ALTER TABLE IF EXISTS ONLY public."Conversation" DROP CONSTRAINT IF EXISTS "Conversation_pkey";
ALTER TABLE IF EXISTS ONLY public."ConversationMessage" DROP CONSTRAINT IF EXISTS "ConversationMessage_pkey";
ALTER TABLE IF EXISTS ONLY public."ConversationMessageStatus" DROP CONSTRAINT IF EXISTS "ConversationMessageStatus_pkey";
ALTER TABLE IF EXISTS ONLY public."ConversationMember" DROP CONSTRAINT IF EXISTS "ConversationMember_pkey";
ALTER TABLE IF EXISTS ONLY public."Contact" DROP CONSTRAINT IF EXISTS "Contact_pkey";
ALTER TABLE IF EXISTS ONLY public."Constant" DROP CONSTRAINT IF EXISTS "Constant_pkey";
ALTER TABLE IF EXISTS ONLY public."Categories" DROP CONSTRAINT IF EXISTS "Categories_pkey";
ALTER TABLE IF EXISTS ONLY public."Budget" DROP CONSTRAINT IF EXISTS "Budget_pkey";
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."Transaction";
DROP TABLE IF EXISTS public."Tradingview";
DROP TABLE IF EXISTS public."Socket";
DROP TABLE IF EXISTS public."Session";
DROP TABLE IF EXISTS public."RefreshSession";
DROP TABLE IF EXISTS public."Planner";
DROP TABLE IF EXISTS public."Otp";
DROP TABLE IF EXISTS public."Notification";
DROP TABLE IF EXISTS public."Loan";
DROP TABLE IF EXISTS public."Investment";
DROP TABLE IF EXISTS public."Goal";
DROP TABLE IF EXISTS public."FailureLog";
DROP TABLE IF EXISTS public."Device";
DROP TABLE IF EXISTS public."ConversationMessageStatus";
DROP TABLE IF EXISTS public."ConversationMessage";
DROP TABLE IF EXISTS public."ConversationMember";
DROP TABLE IF EXISTS public."Conversation";
DROP TABLE IF EXISTS public."Contact";
DROP TABLE IF EXISTS public."Constant";
DROP TABLE IF EXISTS public."Categories";
DROP TABLE IF EXISTS public."Budget";
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Budget; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Budget" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    category text NOT NULL,
    subcategory text NOT NULL,
    title text NOT NULL,
    description text,
    amount double precision NOT NULL,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "monthDay" integer,
    "weekDay" integer,
    "repeatCount" integer
);


--
-- Name: Categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Categories" (
    id text NOT NULL,
    "parentCode" text,
    code text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    color text NOT NULL,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Constant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Constant" (
    id text NOT NULL,
    "column" text,
    code text,
    value text,
    "desc" text,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: Contact; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Contact" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "conversationId" text,
    "firstName" text NOT NULL,
    "lastName" text,
    dob timestamp(3) without time zone,
    gender text,
    "mobileNo" text NOT NULL,
    email text,
    avatar text,
    "avatarBackground" text,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    type text NOT NULL,
    name text,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ConversationMember; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ConversationMember" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ConversationMessage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ConversationMessage" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ConversationMessageStatus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ConversationMessageStatus" (
    id text NOT NULL,
    "conversationMessageId" text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Device; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Device" (
    id text NOT NULL,
    "userId" text NOT NULL,
    device text NOT NULL,
    "deviceType" text NOT NULL,
    os text,
    version text,
    token text,
    data jsonb NOT NULL,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: FailureLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FailureLog" (
    id text NOT NULL,
    "requestId" text NOT NULL,
    method text NOT NULL,
    path text NOT NULL,
    "statusCode" integer NOT NULL,
    message text NOT NULL,
    stack text,
    details jsonb,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    body jsonb
);


--
-- Name: Goal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Goal" (
    id text NOT NULL,
    "userId" text NOT NULL,
    category text NOT NULL,
    subcategory text NOT NULL,
    title text NOT NULL,
    description text,
    "targetAmount" double precision NOT NULL,
    "currentAmount" double precision DEFAULT 0 NOT NULL,
    "remainingYears" integer NOT NULL,
    "targetYear" integer NOT NULL,
    "bornYear" integer,
    "currentAge" integer,
    "targetAge" integer,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: Investment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Investment" (
    id text NOT NULL,
    "userId" text NOT NULL,
    category text NOT NULL,
    subcategory text NOT NULL,
    title text,
    "accumulatedAmount" double precision NOT NULL,
    roi double precision NOT NULL,
    "remainingMonths" integer NOT NULL,
    "investmentAmount" double precision NOT NULL,
    "monthDay" integer NOT NULL,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "onHold" integer DEFAULT 0 NOT NULL
);


--
-- Name: Loan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Loan" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text,
    "principalPendingAmount" double precision NOT NULL,
    roi double precision NOT NULL,
    "remainingMonths" integer NOT NULL,
    "emiAmount" double precision NOT NULL,
    "emiDay" integer NOT NULL,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "recipientId" text NOT NULL,
    read integer DEFAULT 0 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Otp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Otp" (
    id text NOT NULL,
    "mobileNo" text NOT NULL,
    no integer NOT NULL,
    type text NOT NULL,
    try integer DEFAULT 0 NOT NULL,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Planner; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Planner" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "budgetId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text,
    "principalAmount" double precision NOT NULL,
    amount double precision NOT NULL,
    rate double precision NOT NULL,
    tenure integer NOT NULL,
    data jsonb,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: RefreshSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RefreshSession" (
    jti text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    valid boolean DEFAULT true NOT NULL,
    "userAgent" text,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Socket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Socket" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "socketId" text NOT NULL,
    "deviceId" text,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Tradingview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tradingview" (
    id text NOT NULL,
    datetime text,
    "timestamp" bigint,
    timeframe text,
    "orderId" bigint,
    type text,
    exchange text,
    symbol text,
    price double precision,
    volume double precision,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    description text,
    data jsonb NOT NULL,
    "isActive" integer DEFAULT 1 NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    avatar text,
    "avatarBackground" text,
    "createdBy" text,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    dob timestamp(3) without time zone NOT NULL,
    "entryData" jsonb,
    "firstName" text NOT NULL,
    gender text NOT NULL,
    "isActive" integer DEFAULT 1 NOT NULL,
    "lastName" text NOT NULL,
    "mobileNo" text NOT NULL,
    password text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    "oldPasswords" text[] DEFAULT ARRAY[]::text[]
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
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


--
-- Data for Name: Budget; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Budget" (id, "userId", type, category, subcategory, title, description, amount, "isActive", "createdBy", "updatedBy", "deletedBy", "createdAt", "updatedAt", "deletedAt", "monthDay", "weekDay", "repeatCount") FROM stdin;
623bb4ba-17c4-4954-8f5a-b7a0fdbde7ad	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	dining_out	Dining out	\N	3000	1	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 15:11:22.139	\N	\N	\N	\N
504c299a-2ecc-448f-a631-56f0c9025188	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	travel	Travel	\N	5000	1	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 15:11:22.139	\N	15	\N	\N
394f980a-3f62-4f92-8093-66d8dcbf5399	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	rent	Rent	\N	30000	1	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 15:11:22.139	\N	5	\N	\N
5158474e-f942-4086-aef0-e361f96ab02f	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	housing_loan	Housing loan	\N	75000	1	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 15:11:22.139	\N	10	\N	\N
3503b75f-caba-4ddd-ac95-85583136d700	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	housing_addon_loan	Housing addon loan	\N	16223	1	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 15:11:22.139	\N	10	\N	\N
e6760a75-46ea-4a72-9fc0-31bbe3f0e531	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	personal_loan	Personal loan	\N	35764	1	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 15:11:22.139	\N	5	\N	\N
2806119e-c3e3-4f14-8ffd-1ce12f846518	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	electricity_bill	Electricity bill	\N	4000	1	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 15:11:22.139	\N	5	\N	\N
9c86d61a-4c05-4d95-8107-4bd7d5143a19	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	gas_bill	Gas bill	\N	1000	1	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 15:11:22.139	\N	5	\N	\N
4288001f-ac7b-4815-9495-6cf56b4247ea	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	internet_bill	Internet bill	\N	1500	1	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 15:11:22.139	\N	5	\N	\N
c267bb0e-2f2f-492a-b798-3692a058c49a	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	mobile_bill	Mobile bill	\N	3000	1	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 15:11:22.139	\N	5	\N	\N
9792c8b6-649d-4fca-b03f-b520abd48fb1	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	child_education	Child education	\N	7500	1	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 15:11:22.139	\N	5	\N	\N
f162d848-8de4-496d-9ca0-57e176c786ba	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	groceries	Groceries	\N	1000	1	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 15:15:11.306	\N	\N	1	3
55198e4d-d9c1-4a5d-8d0d-7cc746783c1e	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	income	income	salary	Salary	\N	180000	1	\N	\N	\N	2026-08-20 16:23:44.548	2026-08-20 16:23:44.548	\N	1	\N	\N
d11b4d96-8ec9-4ced-abe1-a2e0d9c255e1	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	income	income	rental	Rental	\N	30000	1	\N	\N	\N	2026-08-20 16:23:44.548	2026-08-20 16:23:44.548	\N	5	\N	\N
0c5da2f4-bef3-4ddb-8558-a5d81f82f512	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	income	income	rental	Rental	\N	25000	1	\N	\N	\N	2026-08-20 16:23:44.548	2026-08-20 16:23:44.548	\N	5	\N	\N
8743afad-31bb-4c3b-9821-25ea1c0eec7b	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	personal_loan	Personal loan	\N	62500	0	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 16:26:09.61	2026-08-20 16:26:09.61	5	\N	\N
4c581663-f660-45c9-9c37-af9d3192197a	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	personal_loan	Personal loan	\N	83334	0	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 16:26:09.61	2026-08-20 16:26:09.61	5	\N	\N
26ddf985-82f3-489a-9443-b3b5a4dd2ecf	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	expense	expense	business_expenses	Business expenses	\N	66666	0	\N	\N	\N	2026-08-20 15:11:22.139	2026-08-20 16:28:07.278	2026-08-20 16:28:07.278	5	\N	\N
\.


--
-- Data for Name: Categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Categories" (id, "parentCode", code, title, description, icon, color, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Constant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Constant" (id, "column", code, value, "desc", "isActive", "createdBy", "updatedBy", "deletedBy", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: Contact; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Contact" (id, "userId", "conversationId", "firstName", "lastName", dob, gender, "mobileNo", email, avatar, "avatarBackground", "isActive", "createdBy", "updatedBy", "deletedBy", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Conversation" (id, type, name, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ConversationMember; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ConversationMember" (id, "conversationId", "userId", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ConversationMessage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ConversationMessage" (id, "conversationId", "userId", type, message, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ConversationMessageStatus; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ConversationMessageStatus" (id, "conversationMessageId", "conversationId", "userId", type, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Device; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Device" (id, "userId", device, "deviceType", os, version, token, data, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FailureLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FailureLog" (id, "requestId", method, path, "statusCode", message, stack, details, "userId", "createdAt", body) FROM stdin;
f79c8a3a-699e-4a10-adba-51a52edfdcaf	verification-failure	GET	/api/not-found	404	Route not found: GET /api/not-found	HttpError: Route not found: GET /api/not-found\n    at <anonymous> (/Volumes/LocalDrive/projects/ai/example/apps/api/src/config/app.ts:67:12)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at trimPrefix (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:342:13)\n    at /Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:297:9\n    at processParams (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)\n    at requestLogger (/Volumes/LocalDrive/projects/ai/example/apps/api/src/middlewares/request-logger.ts:20:3)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at trimPrefix (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:342:13)\n    at /Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:297:9	\N	\N	2026-08-20 13:10:14.799	\N
3f52f423-7b43-4546-882d-92e5a91e372f	c0df1707-41d1-4ac1-bf0f-1112e87fd428	POST	/api/auth/register	422	Validation failed	HttpError: Validation failed\n    at <anonymous> (/Volumes/LocalDrive/projects/ai/example/apps/api/src/middlewares/validate.ts:21:14)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:157:13)\n    at Route.dispatch (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:117:3)\n    at handle (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:435:11)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at /Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:295:15\n    at processParams (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)\n    at Function.handle (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:186:3)	{"formErrors": [], "fieldErrors": {"dob": ["Invalid input: expected string, received undefined"], "email": ["Invalid email address"], "gender": ["Invalid input: expected string, received undefined"], "mobileNo": ["Invalid input: expected string, received undefined"], "password": ["Too small: expected string to have >=8 characters"]}}	\N	2026-08-20 13:19:27.484	\N
6abc0abe-a7ae-4722-abc4-54491125eee3	9ec1b1af-60ff-434b-9d2b-286ffa6d6af1	POST	/api/auth/register	422	Validation failed	HttpError: Validation failed\n    at <anonymous> (/Volumes/LocalDrive/projects/ai/example/apps/api/src/middlewares/validate.ts:21:14)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:157:13)\n    at Route.dispatch (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:117:3)\n    at handle (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:435:11)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at /Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:295:15\n    at processParams (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)\n    at Function.handle (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:186:3)	{"formErrors": [], "fieldErrors": {"password": ["Too small: expected string to have >=8 characters"]}}	\N	2026-08-20 13:32:07.476	\N
48f73a3c-4100-425b-8c22-69d8c04e27aa	76e69626-1a78-4115-89a6-e453c8c0a2bc	POST	/api/auth/register	409	Duplicate mobileNo is not allowed	HttpError: Duplicate mobileNo is not allowed\n    at UserModel.errorHandler (/Volumes/LocalDrive/projects/ai/example/apps/api/src/utils/model.util.ts:216:17)\n    at UserModel.execute (/Volumes/LocalDrive/projects/ai/example/apps/api/src/utils/model.util.ts:202:12)\n    at async UserService.create (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/user/user.service.ts:22:18)\n    at async AuthService.register (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/auth/auth.service.ts:34:18)\n    at async AuthController.register (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/auth/auth.controller.ts:15:20)\n    at async <anonymous> (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/auth/auth.route.ts:19:5)	\N	\N	2026-08-20 13:32:22.889	\N
43d72225-043b-48ce-a7ae-e75983adbf1c	01363a0b-2e6b-42b3-b671-2dff9b0f8f43	GET	/favicon.ico	404	Route not found: GET /favicon.ico	HttpError: Route not found: GET /favicon.ico\n    at <anonymous> (/Volumes/LocalDrive/projects/ai/example/apps/api/src/config/app.ts:70:12)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at trimPrefix (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:342:13)\n    at /Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:297:9\n    at processParams (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)\n    at requestLogger (/Volumes/LocalDrive/projects/ai/example/apps/api/src/middlewares/request-logger.ts:20:3)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at trimPrefix (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:342:13)\n    at /Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:297:9	\N	\N	2026-08-20 13:35:35.724	\N
69f04607-0690-4fec-810f-12611ab81833	19dd160f-e51f-44a4-9fb7-24c501cb53ec	POST	/api/auth/login	401	Invalid email or password	HttpError: Invalid email or password\n    at AuthService.login (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/auth/auth.service.ts:53:13)\n    at async AuthController.login (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/auth/auth.controller.ts:21:20)\n    at async <anonymous> (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/auth/auth.route.ts:27:5)	\N	\N	2026-08-20 13:36:16.374	\N
8a7ec571-4667-456d-86b9-ca289a2b33a0	6c480916-78fc-4489-bfcb-d8d946468e1a	POST	/api/auth/login	401	Invalid email or password	HttpError: Invalid email or password\n    at AuthService.login (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/auth/auth.service.ts:53:13)\n    at async AuthController.login (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/auth/auth.controller.ts:21:20)\n    at async <anonymous> (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/auth/auth.route.ts:27:5)	\N	\N	2026-08-20 13:36:28.543	\N
6e94b817-fcde-463c-8f62-9ae68d5cea3e	dcdcb4d3-01d2-49a0-b0bb-0a5264931920	GET	/api/auth/me	401	Missing access token	HttpError: Missing access token\n    at requireAuth (/Volumes/LocalDrive/projects/ai/example/apps/api/src/middlewares/require-auth.ts:15:10)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:157:13)\n    at Route.dispatch (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:117:3)\n    at handle (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:435:11)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at /Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:295:15\n    at processParams (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)\n    at Function.handle (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:186:3)	\N	\N	2026-08-20 13:44:13.138	\N
6ee157df-16b5-4c8d-a918-f4e1b9afe948	c9c98bb6-a8d9-4984-873c-27db0367369b	GET	/api/auth/me	401	Invalid or expired access token	HttpError: Invalid or expired access token\n    at requireAuth (/Volumes/LocalDrive/projects/ai/example/apps/api/src/middlewares/require-auth.ts:23:10)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:157:13)\n    at Route.dispatch (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:117:3)\n    at handle (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:435:11)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at /Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:295:15\n    at processParams (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)\n    at Function.handle (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:186:3)	\N	\N	2026-08-20 13:44:54.136	\N
468532d2-669e-4c92-b53b-bb30e7812b84	d168aa81-89c6-4fc8-8f0c-1151271cfdd4	GET	/api/auth/me	401	Invalid or expired access token	HttpError: Invalid or expired access token\n    at requireAuth (/Volumes/LocalDrive/projects/ai/example/apps/api/src/middlewares/require-auth.ts:23:10)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:157:13)\n    at Route.dispatch (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/route.js:117:3)\n    at handle (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:435:11)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at /Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:295:15\n    at processParams (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)\n    at Function.handle (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:186:3)	\N	\N	2026-08-20 13:45:10.036	\N
ced55176-930b-4828-9178-7fc6b99de5da	92c45865-f040-4dfc-8052-1dd916d7aba3	GET	/api/loans?page=1&limit=25	401	Invalid or expired access token	HttpError: Invalid or expired access token\n    at requireAuth (/Volumes/LocalDrive/projects/ai/example/apps/api/src/middlewares/require-auth.ts:23:10)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at trimPrefix (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:342:13)\n    at /Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:297:9\n    at processParams (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)\n    at Function.handle (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:186:3)\n    at router (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:60:12)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at trimPrefix (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:342:13)	\N	\N	2026-08-20 15:22:28.185	\N
3bc48413-1274-4b03-9e9a-88c92581eb2d	193ac466-120c-4000-918b-973d48da29f9	GET	/api/planner/report	401	Invalid or expired access token	HttpError: Invalid or expired access token\n    at requireAuth (/Volumes/LocalDrive/projects/ai/example/apps/api/src/middlewares/require-auth.ts:23:10)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at trimPrefix (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:342:13)\n    at /Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:297:9\n    at processParams (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)\n    at Function.handle (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:186:3)\n    at router (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:60:12)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at trimPrefix (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:342:13)	\N	\N	2026-08-20 15:54:27.358	\N
3bbc5c26-93d0-4274-8697-8051732fdc9f	67522ba9-6310-4209-827b-a175da3056fc	POST	/api/auth/login	401	Invalid email or password	HttpError: Invalid email or password\n    at AuthService.login (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/auth/auth.service.ts:62:13)\n    at async AuthController.login (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/auth/auth.controller.ts:26:20)\n    at async <anonymous> (/Volumes/LocalDrive/projects/ai/example/apps/api/src/modules/shared/auth/auth.route.ts:27:5)	\N	\N	2026-08-20 16:04:33.83	{"email": "akash.y@example.com", "password": "[redacted]"}
a0334de2-7c04-429b-bda5-d82fcdf0016a	69fb15f8-d206-43a4-a388-a3ed8434e7f0	GET	/favicon.ico	404	Route not found: GET /favicon.ico	HttpError: Route not found: GET /favicon.ico\n    at <anonymous> (/Volumes/LocalDrive/projects/ai/example/apps/api/src/config/app.ts:95:12)\n    at Layer.handleRequest (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/lib/layer.js:152:17)\n    at trimPrefix (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:342:13)\n    at /Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:297:9\n    at processParams (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:582:12)\n    at next (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/router@2.2.0/node_modules/router/index.js:291:5)\n    at SendStream.error (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/serve-static@2.2.1/node_modules/serve-static/index.js:120:7)\n    at SendStream.emit (node:events:518:28)\n    at SendStream.error (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/send@1.2.1/node_modules/send/index.js:168:17)\n    at SendStream.onStatError (/Volumes/LocalDrive/projects/ai/example/node_modules/.pnpm/send@1.2.1/node_modules/send/index.js:315:12)	\N	\N	2026-08-20 16:16:11.214	\N
\.


--
-- Data for Name: Goal; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Goal" (id, "userId", category, subcategory, title, description, "targetAmount", "currentAmount", "remainingYears", "targetYear", "bornYear", "currentAge", "targetAge", "isActive", "createdBy", "updatedBy", "deletedBy", "createdAt", "updatedAt", "deletedAt") FROM stdin;
4b31c737-9be0-4587-aefe-a6a1bbb1d486	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	education	first_child	Child education	First child born in 2024, currently 2 years old	10000000	0	16	2042	2024	2	18	1	\N	\N	\N	2026-08-20 15:46:38.421	2026-08-20 15:46:38.421	\N
668e5979-ad02-441b-9e96-65baaf476cdc	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	marriage	first_child	Child marriage	First child born in 2024, currently 2 years old	10000000	0	16	2042	2024	2	18	1	\N	\N	\N	2026-08-20 15:46:38.421	2026-08-20 15:46:38.421	\N
0117699b-5e88-45f6-b211-509a9c06dfdd	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	education	second_child	2nd child education	Second child expected in 2026	10000000	0	18	2044	2026	0	18	1	\N	\N	\N	2026-08-20 15:46:38.421	2026-08-20 15:46:38.421	\N
951395c7-3062-494d-8269-19532989f03c	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	marriage	second_child	2nd child marriage	Second child expected in 2026	10000000	0	18	2044	2026	0	18	1	\N	\N	\N	2026-08-20 15:46:38.421	2026-08-20 15:46:38.421	\N
edb837a4-5f89-4481-877c-c984b36ec0b5	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	retirement	lean_fire	Lean FIRE	Retire at 45; currently 34	30000000	0	11	2037	\N	34	45	1	\N	\N	\N	2026-08-20 15:46:38.421	2026-08-20 15:46:38.421	\N
\.


--
-- Data for Name: Investment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Investment" (id, "userId", category, subcategory, title, "accumulatedAmount", roi, "remainingMonths", "investmentAmount", "monthDay", "isActive", "createdBy", "updatedBy", "deletedBy", "createdAt", "updatedAt", "deletedAt", "onHold") FROM stdin;
43f7ef64-c4c3-4199-9e5e-694081483d65	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	investment	fd	FD	1000000	7	60	0	5	1	\N	\N	\N	2026-08-20 15:30:45.618	2026-08-20 15:30:45.618	\N	0
fd75d9b3-d02e-48ea-b277-d87ddedbf195	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	investment	ppf	PPF	300000	7	48	7500	5	1	\N	\N	\N	2026-08-20 15:30:45.618	2026-08-20 16:36:47.377	\N	1
6387587b-68cd-4b04-8c4c-69daf9808594	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	investment	nps	NPS	600000	11	60	10000	5	1	\N	\N	\N	2026-08-20 15:30:45.618	2026-08-20 16:36:47.377	\N	1
25fd6768-7f97-4b19-ad3e-dad737d873d1	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	investment	epf	EPF	1000000	7	60	10000	5	1	\N	\N	\N	2026-08-20 15:30:45.618	2026-08-20 16:36:47.377	\N	1
\.


--
-- Data for Name: Loan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Loan" (id, "userId", title, "principalPendingAmount", roi, "remainingMonths", "emiAmount", "emiDay", "isActive", "createdBy", "updatedBy", "deletedBy", "createdAt", "updatedAt", "deletedAt") FROM stdin;
8f3036b0-f8aa-4191-a9f4-8be1ff7f87fe	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	\N	6730000	7.35	131	75000	10	1	\N	\N	\N	2026-08-20 14:51:51.749	2026-08-20 14:51:51.749	\N
281670dc-1e19-4d21-a5a0-f839718088c0	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	\N	1732638	7.5	177	16223	10	1	\N	\N	\N	2026-08-20 14:55:54.022	2026-08-20 14:55:54.022	\N
6fcf2692-5994-4504-bad1-eb5ca78af8cd	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	\N	976167	11.25	32	35764	5	1	\N	\N	\N	2026-08-20 14:55:54.022	2026-08-20 14:55:54.022	\N
3fdd8db1-d476-4cb5-896b-bd14cae8127d	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	\N	1500000	12	24	62500	5	0	\N	\N	\N	2026-08-20 14:55:54.022	2026-08-20 16:26:09.61	2026-08-20 16:26:09.61
f1afe565-32ca-4a6e-9e66-4360d7269da7	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	\N	1000000	0	12	83334	5	0	\N	\N	\N	2026-08-20 14:55:54.022	2026-08-20 16:26:09.61	2026-08-20 16:26:09.61
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, title, description, "recipientId", read, "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Otp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Otp" (id, "mobileNo", no, type, try, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Planner; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Planner" (id, "userId", "budgetId", type, title, description, "principalAmount", amount, rate, tenure, data, "isActive", "createdBy", "updatedBy", "deletedBy", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: RefreshSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RefreshSession" (jti, "userId", "tokenHash", "expiresAt", "createdAt") FROM stdin;
4468aa2f-ac05-4628-bbd5-3cd5e6b8e005	968deebf-94bb-447e-ae58-fe43b338cd6b	0cd0114eb0c60a3e04fc6cac9f3ca8e4ec83babd899c13dad644ac53c2de211f	2026-08-27 13:19:27.403	2026-08-20 13:19:27.404
5cc0aff3-8785-400a-8aaa-c63427cac287	968deebf-94bb-447e-ae58-fe43b338cd6b	70e7597cc372b9789f53b80e0341407e694455d63b582d29251348728aee369e	2026-08-27 13:19:27.471	2026-08-20 13:19:27.472
cebb17e3-ee25-4be8-ac6b-647a69d0d232	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	5387587b8a1b6403470741baaadaab9b5f94b0b272e89f4b879f448fdd91ae3d	2026-08-27 13:43:50.461	2026-08-20 13:43:50.462
eeee780a-8b5d-4eb1-90ee-f4c594a540e7	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	242a92e745a123b8bbe044f4b9d09a59952e3e1ee310fb55b7bb7804a4fd9225	2026-08-27 14:25:01.213	2026-08-20 14:25:01.214
cc6cff2f-b021-4d76-9a5e-df4bedaa5152	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	9478b039dccfee4cb6d4ed09c0cb6e6325b33ffc7ef68f9e657b191f9d969209	2026-08-27 15:23:04.963	2026-08-20 15:23:04.964
109c21e0-52a3-41bb-af88-a9df69742e14	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	f1c257a5cd073626c348b07cdca95c38973929955d4f2edf516d57e571a32364	2026-08-27 15:54:50.788	2026-08-20 15:54:50.789
8c3ebe8f-a1b8-43ed-aa49-6479b7f820d6	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	e52e1af4d7c541b63c8e453443f68db512351df72ba384942014a0add5848e06	2026-08-27 16:16:33.567	2026-08-20 16:16:33.569
c8f60b2d-2cac-4e14-9aca-49058a3e6289	d2fc64e9-aa80-46a3-b860-6f313be8a2b9	da3f421c25f3d3f21d9a1ec42b1d049665db648c61cf5e8e79e5524f7ee61b74	2026-08-27 16:37:53.399	2026-08-20 16:37:53.4
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Session" (id, "userId", valid, "userAgent", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Socket; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Socket" (id, "userId", "socketId", "deviceId", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Tradingview; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Tradingview" (id, datetime, "timestamp", timeframe, "orderId", type, exchange, symbol, price, volume, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Transaction" (id, "userId", title, description, data, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, "createdAt", avatar, "avatarBackground", "createdBy", "deletedAt", "deletedBy", dob, "entryData", "firstName", gender, "isActive", "lastName", "mobileNo", password, "updatedAt", "updatedBy", "oldPasswords") FROM stdin;
968deebf-94bb-447e-ae58-fe43b338cd6b	ada@example.com	2026-08-20 13:19:27.398	\N	\N	\N	\N	\N	1990-05-01 00:00:00	\N	Ada	female	1	Lovelace	9876543210	$2b$10$7OxX6A3hEf.mo7Aq6JEFkO0vSoqOxYh1wEiM4nqQAxvXeK/XFlN9e	2026-08-20 13:19:27.398	\N	{}
d2fc64e9-aa80-46a3-b860-6f313be8a2b9	akash.y@example.com	2026-08-20 13:43:50.44	\N	\N	\N	\N	\N	1990-05-01 00:00:00	\N	Akash	male	1	Y	9876543211	$2b$10$2Sl7Lo1uRtIsCzxlVIrkNe6y4HlSPaAwU07OPuYjIemxGQUakUZyW	2026-08-20 13:43:50.44	\N	{}
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4c27a6af-2616-4ea6-a9a8-d758ef5cc6ca	e96b4b8fe1c98e4cc7c37eac685acce6bad16b2ed01710d47ccd06b6227b7253	2026-08-20 16:44:21.505323+00	20260820120000_init		\N	2026-08-20 16:44:21.505323+00	0
\.


--
-- Name: Budget Budget_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_pkey" PRIMARY KEY (id);


--
-- Name: Categories Categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Categories"
    ADD CONSTRAINT "Categories_pkey" PRIMARY KEY (id);


--
-- Name: Constant Constant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Constant"
    ADD CONSTRAINT "Constant_pkey" PRIMARY KEY (id);


--
-- Name: Contact Contact_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_pkey" PRIMARY KEY (id);


--
-- Name: ConversationMember ConversationMember_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationMember"
    ADD CONSTRAINT "ConversationMember_pkey" PRIMARY KEY (id);


--
-- Name: ConversationMessageStatus ConversationMessageStatus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationMessageStatus"
    ADD CONSTRAINT "ConversationMessageStatus_pkey" PRIMARY KEY (id);


--
-- Name: ConversationMessage ConversationMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationMessage"
    ADD CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Device Device_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Device"
    ADD CONSTRAINT "Device_pkey" PRIMARY KEY (id);


--
-- Name: FailureLog FailureLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FailureLog"
    ADD CONSTRAINT "FailureLog_pkey" PRIMARY KEY (id);


--
-- Name: Goal Goal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Goal"
    ADD CONSTRAINT "Goal_pkey" PRIMARY KEY (id);


--
-- Name: Investment Investment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Investment"
    ADD CONSTRAINT "Investment_pkey" PRIMARY KEY (id);


--
-- Name: Loan Loan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Loan"
    ADD CONSTRAINT "Loan_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Otp Otp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Otp"
    ADD CONSTRAINT "Otp_pkey" PRIMARY KEY (id);


--
-- Name: Planner Planner_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Planner"
    ADD CONSTRAINT "Planner_pkey" PRIMARY KEY (id);


--
-- Name: RefreshSession RefreshSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshSession"
    ADD CONSTRAINT "RefreshSession_pkey" PRIMARY KEY (jti);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Socket Socket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Socket"
    ADD CONSTRAINT "Socket_pkey" PRIMARY KEY (id);


--
-- Name: Tradingview Tradingview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tradingview"
    ADD CONSTRAINT "Tradingview_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Budget_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Budget_userId_idx" ON public."Budget" USING btree ("userId");


--
-- Name: Categories_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Categories_code_key" ON public."Categories" USING btree (code);


--
-- Name: Categories_parentCode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Categories_parentCode_idx" ON public."Categories" USING btree ("parentCode");


--
-- Name: Constant_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Constant_code_idx" ON public."Constant" USING btree (code);


--
-- Name: Constant_column_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Constant_column_idx" ON public."Constant" USING btree ("column");


--
-- Name: Contact_conversationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Contact_conversationId_idx" ON public."Contact" USING btree ("conversationId");


--
-- Name: Contact_mobileNo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Contact_mobileNo_idx" ON public."Contact" USING btree ("mobileNo");


--
-- Name: Contact_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Contact_userId_idx" ON public."Contact" USING btree ("userId");


--
-- Name: ConversationMember_conversationId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ConversationMember_conversationId_userId_key" ON public."ConversationMember" USING btree ("conversationId", "userId");


--
-- Name: ConversationMember_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ConversationMember_userId_idx" ON public."ConversationMember" USING btree ("userId");


--
-- Name: ConversationMessageStatus_conversationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ConversationMessageStatus_conversationId_idx" ON public."ConversationMessageStatus" USING btree ("conversationId");


--
-- Name: ConversationMessageStatus_conversationMessageId_userId_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ConversationMessageStatus_conversationMessageId_userId_type_key" ON public."ConversationMessageStatus" USING btree ("conversationMessageId", "userId", type);


--
-- Name: ConversationMessageStatus_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ConversationMessageStatus_userId_idx" ON public."ConversationMessageStatus" USING btree ("userId");


--
-- Name: ConversationMessage_conversationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ConversationMessage_conversationId_idx" ON public."ConversationMessage" USING btree ("conversationId");


--
-- Name: ConversationMessage_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ConversationMessage_userId_idx" ON public."ConversationMessage" USING btree ("userId");


--
-- Name: Device_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Device_userId_idx" ON public."Device" USING btree ("userId");


--
-- Name: FailureLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FailureLog_createdAt_idx" ON public."FailureLog" USING btree ("createdAt");


--
-- Name: FailureLog_requestId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FailureLog_requestId_idx" ON public."FailureLog" USING btree ("requestId");


--
-- Name: FailureLog_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FailureLog_userId_idx" ON public."FailureLog" USING btree ("userId");


--
-- Name: Goal_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Goal_userId_idx" ON public."Goal" USING btree ("userId");


--
-- Name: Investment_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Investment_userId_idx" ON public."Investment" USING btree ("userId");


--
-- Name: Loan_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Loan_userId_idx" ON public."Loan" USING btree ("userId");


--
-- Name: Notification_recipientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_recipientId_idx" ON public."Notification" USING btree ("recipientId");


--
-- Name: Otp_mobileNo_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Otp_mobileNo_type_idx" ON public."Otp" USING btree ("mobileNo", type);


--
-- Name: Planner_budgetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Planner_budgetId_idx" ON public."Planner" USING btree ("budgetId");


--
-- Name: Planner_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Planner_userId_idx" ON public."Planner" USING btree ("userId");


--
-- Name: RefreshSession_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RefreshSession_userId_idx" ON public."RefreshSession" USING btree ("userId");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: Socket_deviceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Socket_deviceId_idx" ON public."Socket" USING btree ("deviceId");


--
-- Name: Socket_socketId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Socket_socketId_idx" ON public."Socket" USING btree ("socketId");


--
-- Name: Socket_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Socket_userId_idx" ON public."Socket" USING btree ("userId");


--
-- Name: Tradingview_symbol_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Tradingview_symbol_idx" ON public."Tradingview" USING btree (symbol);


--
-- Name: Tradingview_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Tradingview_timestamp_idx" ON public."Tradingview" USING btree ("timestamp");


--
-- Name: Transaction_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_userId_idx" ON public."Transaction" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_mobileNo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_mobileNo_key" ON public."User" USING btree ("mobileNo");


--
-- Name: Budget Budget_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Categories Categories_parentCode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Categories"
    ADD CONSTRAINT "Categories_parentCode_fkey" FOREIGN KEY ("parentCode") REFERENCES public."Categories"(code) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Contact Contact_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Contact Contact_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationMember ConversationMember_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationMember"
    ADD CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationMember ConversationMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationMember"
    ADD CONSTRAINT "ConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationMessageStatus ConversationMessageStatus_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationMessageStatus"
    ADD CONSTRAINT "ConversationMessageStatus_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationMessageStatus ConversationMessageStatus_conversationMessageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationMessageStatus"
    ADD CONSTRAINT "ConversationMessageStatus_conversationMessageId_fkey" FOREIGN KEY ("conversationMessageId") REFERENCES public."ConversationMessage"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationMessageStatus ConversationMessageStatus_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationMessageStatus"
    ADD CONSTRAINT "ConversationMessageStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationMessage ConversationMessage_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationMessage"
    ADD CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationMessage ConversationMessage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationMessage"
    ADD CONSTRAINT "ConversationMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Device Device_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Device"
    ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FailureLog FailureLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FailureLog"
    ADD CONSTRAINT "FailureLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Goal Goal_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Goal"
    ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Investment Investment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Investment"
    ADD CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Loan Loan_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Loan"
    ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_recipientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Planner Planner_budgetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Planner"
    ADD CONSTRAINT "Planner_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES public."Budget"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Planner Planner_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Planner"
    ADD CONSTRAINT "Planner_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RefreshSession RefreshSession_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshSession"
    ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Socket Socket_deviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Socket"
    ADD CONSTRAINT "Socket_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES public."Device"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Socket Socket_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Socket"
    ADD CONSTRAINT "Socket_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Transaction Transaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 3bbxP6AwX0n4B09a4sGRLAYNYnzF7cAPl3RKt7zWhpcIqjR3voZ7jmUHQZ1PiOu

