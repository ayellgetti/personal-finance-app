import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth/store";
import {
  convertEnquiry as convertEnquiryRemote,
  createCalendarEvent as createCalendarEventRemote,
  createClient as createClientRemote,
  createContact as createContactRemote,
  createCrmUser as createCrmUserRemote,
  createEnquiry as createEnquiryRemote,
  createFollowUp as createFollowUpRemote,
  createPayment as createPaymentRemote,
  createTask as createTaskRemote,
  fetchCrmMe,
  fetchDashboard,
  listCalendar,
  listClients,
  listContacts,
  listCrmUsers,
  listEnquiries,
  listFollowUps,
  listPayments,
  listPermissions,
  listRoles,
  listTasks,
  removeCalendarEvent as removeCalendarEventRemote,
  removeClient as removeClientRemote,
  removeContact as removeContactRemote,
  removeEnquiry as removeEnquiryRemote,
  removeFollowUp as removeFollowUpRemote,
  removePayment as removePaymentRemote,
  removeTask as removeTaskRemote,
  updateCalendarEvent as updateCalendarEventRemote,
  updateClient as updateClientRemote,
  updateContact as updateContactRemote,
  updateCrmUser as updateCrmUserRemote,
  updateEnquiry as updateEnquiryRemote,
  updateFollowUp as updateFollowUpRemote,
  updatePayment as updatePaymentRemote,
  updateRolePermissions as updateRolePermissionsRemote,
  updateTask as updateTaskRemote,
  updateTaskStatus as updateTaskStatusRemote,
  type ListCalendarQuery,
  type ListClientsQuery,
  type ListContactsQuery,
  type ListCrmUsersQuery,
  type ListEnquiriesQuery,
  type ListFollowUpsQuery,
  type ListPaymentsQuery,
  type ListTasksQuery,
} from "@/lib/crm/remote";
import type {
  ConvertedEnquiry,
  CreateCalendarEventInput,
  CreateClientInput,
  CreateContactInput,
  CreateCrmUserInput,
  CreateEnquiryInput,
  CreateFollowUpInput,
  CreatePaymentInput,
  CreateTaskInput,
  CrmCalendarItem,
  CrmClient,
  CrmContact,
  CrmDashboard,
  CrmEnquiry,
  CrmFollowUp,
  CrmMe,
  CrmPayment,
  CrmPermission,
  CrmRoleDetail,
  CrmStaffUser,
  CrmTask,
  CrmTaskStatus,
  UpdateCrmUserInput,
} from "@/types/crm";

export type CrmSessionStatus = "idle" | "loading" | "ready" | "forbidden" | "error";
export type ResourceStatus = "idle" | "loading" | "ready" | "forbidden" | "error";

export type ListCache<T> = {
  status: ResourceStatus;
  items: T[];
  errorMessage: string | null;
};

export type DashboardCache = {
  status: ResourceStatus;
  data: CrmDashboard | null;
  errorMessage: string | null;
};

function idleList<T>(): ListCache<T> {
  return { status: "idle", items: [], errorMessage: null };
}

function failList<T>(error: unknown): ListCache<T> {
  if (error instanceof ApiError && error.status === 403) {
    return { status: "forbidden", items: [], errorMessage: null };
  }
  const message = error instanceof Error ? error.message : "Request failed";
  toast.error(message);
  return { status: "error", items: [], errorMessage: message };
}

function mutationMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Request failed";
}

function upsertById<T extends { id: string }>(items: T[], next: T): T[] {
  const exists = items.some((item) => item.id === next.id);
  if (exists) return items.map((item) => (item.id === next.id ? next : item));
  return [next, ...items];
}

type CrmContextValue = {
  status: CrmSessionStatus;
  me: CrmMe | null;
  permissions: string[];
  errorMessage: string | null;
  hasPermission: (code: string) => boolean;
  reload: () => void;
  dashboard: DashboardCache;
  loadDashboard: () => Promise<void>;
  contacts: ListCache<CrmContact>;
  loadContacts: (query?: ListContactsQuery) => Promise<void>;
  createContact: (input: CreateContactInput) => Promise<CrmContact>;
  updateContact: (id: string, input: Partial<CreateContactInput>) => Promise<CrmContact>;
  removeContact: (id: string) => Promise<void>;
  enquiries: ListCache<CrmEnquiry>;
  loadEnquiries: (query?: ListEnquiriesQuery) => Promise<void>;
  createEnquiry: (input: CreateEnquiryInput) => Promise<CrmEnquiry>;
  updateEnquiry: (id: string, input: Partial<CreateEnquiryInput>) => Promise<CrmEnquiry>;
  removeEnquiry: (id: string) => Promise<void>;
  convertEnquiry: (id: string, body?: { billingName?: string }) => Promise<ConvertedEnquiry>;
  followUps: ListCache<CrmFollowUp>;
  loadFollowUps: (query?: ListFollowUpsQuery) => Promise<void>;
  createFollowUp: (input: CreateFollowUpInput) => Promise<CrmFollowUp>;
  updateFollowUp: (id: string, input: Partial<CreateFollowUpInput>) => Promise<CrmFollowUp>;
  removeFollowUp: (id: string) => Promise<void>;
  clients: ListCache<CrmClient>;
  loadClients: (query?: ListClientsQuery) => Promise<void>;
  createClient: (input: CreateClientInput) => Promise<CrmClient>;
  updateClient: (id: string, input: Partial<CreateClientInput>) => Promise<CrmClient>;
  removeClient: (id: string) => Promise<void>;
  payments: ListCache<CrmPayment>;
  loadPayments: (query?: ListPaymentsQuery) => Promise<void>;
  createPayment: (input: CreatePaymentInput) => Promise<CrmPayment>;
  updatePayment: (id: string, input: Partial<CreatePaymentInput>) => Promise<CrmPayment>;
  removePayment: (id: string) => Promise<void>;
  tasks: ListCache<CrmTask>;
  loadTasks: (query?: ListTasksQuery) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<CrmTask>;
  updateTask: (id: string, input: Partial<CreateTaskInput>) => Promise<CrmTask>;
  updateTaskStatus: (id: string, status: CrmTaskStatus) => Promise<CrmTask>;
  removeTask: (id: string) => Promise<void>;
  calendar: ListCache<CrmCalendarItem>;
  loadCalendar: (query: ListCalendarQuery) => Promise<void>;
  createCalendarEvent: (input: CreateCalendarEventInput) => Promise<void>;
  updateCalendarEvent: (id: string, input: Partial<CreateCalendarEventInput>) => Promise<void>;
  removeCalendarEvent: (id: string) => Promise<void>;
  users: ListCache<CrmStaffUser>;
  loadUsers: (query?: ListCrmUsersQuery) => Promise<void>;
  createUser: (input: CreateCrmUserInput) => Promise<CrmStaffUser>;
  updateUser: (id: string, input: UpdateCrmUserInput) => Promise<CrmStaffUser>;
  roles: ListCache<CrmRoleDetail>;
  permissionsCatalog: ListCache<CrmPermission>;
  loadRoles: () => Promise<void>;
  loadPermissionsCatalog: () => Promise<void>;
  updateRolePermissions: (id: string, permissionIds: string[]) => Promise<CrmRoleDetail>;
};

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<CrmSessionStatus>(() => (user ? "loading" : "idle"));
  const [me, setMe] = useState<CrmMe | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [dashboard, setDashboard] = useState<DashboardCache>({
    status: "idle",
    data: null,
    errorMessage: null,
  });
  const [contacts, setContacts] = useState<ListCache<CrmContact>>(idleList);
  const [enquiries, setEnquiries] = useState<ListCache<CrmEnquiry>>(idleList);
  const [followUps, setFollowUps] = useState<ListCache<CrmFollowUp>>(idleList);
  const [clients, setClients] = useState<ListCache<CrmClient>>(idleList);
  const [payments, setPayments] = useState<ListCache<CrmPayment>>(idleList);
  const [tasks, setTasks] = useState<ListCache<CrmTask>>(idleList);
  const [calendar, setCalendar] = useState<ListCache<CrmCalendarItem>>(idleList);
  const [users, setUsers] = useState<ListCache<CrmStaffUser>>(idleList);
  const [roles, setRoles] = useState<ListCache<CrmRoleDetail>>(idleList);
  const [permissionsCatalog, setPermissionsCatalog] = useState<ListCache<CrmPermission>>(idleList);
  const [calendarRange, setCalendarRange] = useState<ListCalendarQuery | null>(null);

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      setMe(null);
      setErrorMessage(null);
      setStatus("idle");
      setDashboard({ status: "idle", data: null, errorMessage: null });
      setContacts(idleList());
      setEnquiries(idleList());
      setFollowUps(idleList());
      setClients(idleList());
      setPayments(idleList());
      setTasks(idleList());
      setCalendar(idleList());
      setUsers(idleList());
      setRoles(idleList());
      setPermissionsCatalog(idleList());
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    void fetchCrmMe()
      .then((session) => {
        if (cancelled) return;
        setMe(session);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 403) {
          setMe(null);
          setStatus("forbidden");
          return;
        }
        if (error instanceof ApiError && error.status === 401) {
          void logout();
          return;
        }
        setMe(null);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load CRM session");
      });

    return () => {
      cancelled = true;
    };
  }, [user, logout, reloadToken]);

  const loadDashboard = useCallback(async () => {
    setDashboard((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const data = await fetchDashboard();
      setDashboard({ status: "ready", data, errorMessage: null });
    } catch (error) {
      const failed = failList<never>(error);
      setDashboard({ status: failed.status, data: null, errorMessage: failed.errorMessage });
    }
  }, []);

  const loadContacts = useCallback(async (query?: ListContactsQuery) => {
    setContacts((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const result = await listContacts(query);
      setContacts({ status: "ready", items: result.items, errorMessage: null });
    } catch (error) {
      setContacts(failList(error));
    }
  }, []);

  const createContact = useCallback(async (input: CreateContactInput) => {
    try {
      const contact = await createContactRemote(input);
      setContacts((current) => ({ ...current, items: upsertById(current.items, contact) }));
      toast.success("Contact created");
      return contact;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const updateContact = useCallback(async (id: string, input: Partial<CreateContactInput>) => {
    try {
      const contact = await updateContactRemote(id, input);
      setContacts((current) => ({ ...current, items: upsertById(current.items, contact) }));
      toast.success("Contact updated");
      return contact;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const removeContact = useCallback(async (id: string) => {
    try {
      await removeContactRemote(id);
      setContacts((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
      toast.success("Contact removed");
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const loadEnquiries = useCallback(async (query?: ListEnquiriesQuery) => {
    setEnquiries((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const result = await listEnquiries(query);
      setEnquiries({ status: "ready", items: result.items, errorMessage: null });
    } catch (error) {
      setEnquiries(failList(error));
    }
  }, []);

  const createEnquiry = useCallback(async (input: CreateEnquiryInput) => {
    try {
      const enquiry = await createEnquiryRemote(input);
      setEnquiries((current) => ({ ...current, items: upsertById(current.items, enquiry) }));
      toast.success("Enquiry created");
      return enquiry;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const updateEnquiry = useCallback(async (id: string, input: Partial<CreateEnquiryInput>) => {
    try {
      const enquiry = await updateEnquiryRemote(id, input);
      setEnquiries((current) => ({ ...current, items: upsertById(current.items, enquiry) }));
      toast.success("Enquiry updated");
      return enquiry;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const removeEnquiry = useCallback(async (id: string) => {
    try {
      await removeEnquiryRemote(id);
      setEnquiries((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
      toast.success("Enquiry removed");
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const convertEnquiry = useCallback(async (id: string, body: { billingName?: string } = {}) => {
    try {
      const converted = await convertEnquiryRemote(id, body);
      setEnquiries((current) => ({
        ...current,
        items: upsertById(current.items, converted.enquiry),
      }));
      setContacts((current) => ({
        ...current,
        items: upsertById(current.items, converted.contact),
      }));
      setClients((current) => ({
        status: current.status === "idle" ? "ready" : current.status,
        items: upsertById(current.items, converted.client),
        errorMessage: null,
      }));
      toast.success("Enquiry converted");
      return converted;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const loadFollowUps = useCallback(async (query?: ListFollowUpsQuery) => {
    setFollowUps((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const result = await listFollowUps(query);
      setFollowUps({ status: "ready", items: result.items, errorMessage: null });
    } catch (error) {
      setFollowUps(failList(error));
    }
  }, []);

  const createFollowUp = useCallback(async (input: CreateFollowUpInput) => {
    try {
      const followUp = await createFollowUpRemote(input);
      setFollowUps((current) => ({ ...current, items: upsertById(current.items, followUp) }));
      toast.success("Follow-up created");
      return followUp;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const updateFollowUp = useCallback(async (id: string, input: Partial<CreateFollowUpInput>) => {
    try {
      const followUp = await updateFollowUpRemote(id, input);
      setFollowUps((current) => ({ ...current, items: upsertById(current.items, followUp) }));
      toast.success("Follow-up updated");
      return followUp;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const removeFollowUp = useCallback(async (id: string) => {
    try {
      await removeFollowUpRemote(id);
      setFollowUps((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
      toast.success("Follow-up removed");
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const loadClients = useCallback(async (query?: ListClientsQuery) => {
    setClients((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const result = await listClients(query);
      setClients({ status: "ready", items: result.items, errorMessage: null });
    } catch (error) {
      setClients(failList(error));
    }
  }, []);

  const createClient = useCallback(async (input: CreateClientInput) => {
    try {
      const client = await createClientRemote(input);
      setClients((current) => ({ ...current, items: upsertById(current.items, client) }));
      toast.success("Client created");
      return client;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const updateClient = useCallback(async (id: string, input: Partial<CreateClientInput>) => {
    try {
      const client = await updateClientRemote(id, input);
      setClients((current) => ({ ...current, items: upsertById(current.items, client) }));
      toast.success("Client updated");
      return client;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const removeClient = useCallback(async (id: string) => {
    try {
      await removeClientRemote(id);
      setClients((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
      toast.success("Client removed");
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const loadPayments = useCallback(async (query?: ListPaymentsQuery) => {
    setPayments((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const result = await listPayments(query);
      setPayments({ status: "ready", items: result.items, errorMessage: null });
      return;
    } catch (error) {
      setPayments(failList(error));
    }
  }, []);

  const createPayment = useCallback(async (input: CreatePaymentInput) => {
    try {
      const payment = await createPaymentRemote(input);
      setPayments((current) => ({ ...current, items: upsertById(current.items, payment) }));
      toast.success("Payment recorded");
      return payment;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const updatePayment = useCallback(async (id: string, input: Partial<CreatePaymentInput>) => {
    try {
      const payment = await updatePaymentRemote(id, input);
      setPayments((current) => ({ ...current, items: upsertById(current.items, payment) }));
      toast.success("Payment updated");
      return payment;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const removePayment = useCallback(async (id: string) => {
    try {
      await removePaymentRemote(id);
      setPayments((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
      toast.success("Payment removed");
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const loadTasks = useCallback(async (query?: ListTasksQuery) => {
    setTasks((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const result = await listTasks({ limit: 100, ...query });
      setTasks({ status: "ready", items: result.items, errorMessage: null });
    } catch (error) {
      setTasks(failList(error));
    }
  }, []);

  const createTask = useCallback(async (input: CreateTaskInput) => {
    try {
      const task = await createTaskRemote(input);
      setTasks((current) => ({ ...current, items: upsertById(current.items, task) }));
      toast.success("Task created");
      return task;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const updateTask = useCallback(async (id: string, input: Partial<CreateTaskInput>) => {
    try {
      const task = await updateTaskRemote(id, input);
      setTasks((current) => ({ ...current, items: upsertById(current.items, task) }));
      toast.success("Task updated");
      return task;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const updateTaskStatus = useCallback(async (id: string, nextStatus: CrmTaskStatus) => {
    try {
      const task = await updateTaskStatusRemote(id, nextStatus);
      setTasks((current) => ({ ...current, items: upsertById(current.items, task) }));
      toast.success("Task status updated");
      return task;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const removeTask = useCallback(async (id: string) => {
    try {
      await removeTaskRemote(id);
      setTasks((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
      toast.success("Task removed");
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const loadCalendar = useCallback(async (query: ListCalendarQuery) => {
    setCalendarRange(query);
    setCalendar((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const result = await listCalendar(query);
      setCalendar({ status: "ready", items: result.items, errorMessage: null });
    } catch (error) {
      setCalendar(failList(error));
    }
  }, []);

  const refreshCalendar = useCallback(async () => {
    if (!calendarRange) return;
    const result = await listCalendar(calendarRange);
    setCalendar({ status: "ready", items: result.items, errorMessage: null });
  }, [calendarRange]);

  const createCalendarEvent = useCallback(
    async (input: CreateCalendarEventInput) => {
      try {
        await createCalendarEventRemote(input);
        toast.success("Event created");
        await refreshCalendar();
      } catch (error) {
        toast.error(mutationMessage(error));
        throw error;
      }
    },
    [refreshCalendar],
  );

  const updateCalendarEvent = useCallback(
    async (id: string, input: Partial<CreateCalendarEventInput>) => {
      try {
        await updateCalendarEventRemote(id, input);
        toast.success("Event updated");
        await refreshCalendar();
      } catch (error) {
        toast.error(mutationMessage(error));
        throw error;
      }
    },
    [refreshCalendar],
  );

  const removeCalendarEvent = useCallback(
    async (id: string) => {
      try {
        await removeCalendarEventRemote(id);
        toast.success("Event removed");
        setCalendar((current) => ({
          ...current,
          items: current.items.filter((item) => !(item.kind === "event" && item.id === id)),
        }));
      } catch (error) {
        toast.error(mutationMessage(error));
        throw error;
      }
    },
    [],
  );

  const loadUsers = useCallback(async (query?: ListCrmUsersQuery) => {
    setUsers((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const result = await listCrmUsers(query);
      setUsers({ status: "ready", items: result.items, errorMessage: null });
    } catch (error) {
      setUsers(failList(error));
    }
  }, []);

  const createUser = useCallback(async (input: CreateCrmUserInput) => {
    try {
      const next = await createCrmUserRemote(input);
      setUsers((current) => ({ ...current, items: upsertById(current.items, next) }));
      toast.success("User created");
      return next;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (id: string, input: UpdateCrmUserInput) => {
    try {
      const next = await updateCrmUserRemote(id, input);
      setUsers((current) => ({ ...current, items: upsertById(current.items, next) }));
      toast.success("User updated");
      return next;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const loadRoles = useCallback(async () => {
    setRoles((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const items = await listRoles();
      setRoles({ status: "ready", items, errorMessage: null });
    } catch (error) {
      setRoles(failList(error));
    }
  }, []);

  const loadPermissionsCatalog = useCallback(async () => {
    setPermissionsCatalog((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const items = await listPermissions();
      setPermissionsCatalog({ status: "ready", items, errorMessage: null });
    } catch (error) {
      setPermissionsCatalog(failList(error));
    }
  }, []);

  const updateRolePermissions = useCallback(async (id: string, permissionIds: string[]) => {
    try {
      const role = await updateRolePermissionsRemote(id, permissionIds);
      setRoles((current) => ({ ...current, items: upsertById(current.items, role) }));
      toast.success("Role updated");
      return role;
    } catch (error) {
      toast.error(mutationMessage(error));
      throw error;
    }
  }, []);

  const value = useMemo<CrmContextValue>(
    () => ({
      status,
      me,
      permissions: me?.permissions ?? [],
      errorMessage,
      hasPermission: (code) => Boolean(me?.permissions.includes(code)),
      reload,
      dashboard,
      loadDashboard,
      contacts,
      loadContacts,
      createContact,
      updateContact,
      removeContact,
      enquiries,
      loadEnquiries,
      createEnquiry,
      updateEnquiry,
      removeEnquiry,
      convertEnquiry,
      followUps,
      loadFollowUps,
      createFollowUp,
      updateFollowUp,
      removeFollowUp,
      clients,
      loadClients,
      createClient,
      updateClient,
      removeClient,
      payments,
      loadPayments,
      createPayment,
      updatePayment,
      removePayment,
      tasks,
      loadTasks,
      createTask,
      updateTask,
      updateTaskStatus,
      removeTask,
      calendar,
      loadCalendar,
      createCalendarEvent,
      updateCalendarEvent,
      removeCalendarEvent,
      users,
      loadUsers,
      createUser,
      updateUser,
      roles,
      permissionsCatalog,
      loadRoles,
      loadPermissionsCatalog,
      updateRolePermissions,
    }),
    [
      status,
      me,
      errorMessage,
      reload,
      dashboard,
      loadDashboard,
      contacts,
      loadContacts,
      createContact,
      updateContact,
      removeContact,
      enquiries,
      loadEnquiries,
      createEnquiry,
      updateEnquiry,
      removeEnquiry,
      convertEnquiry,
      followUps,
      loadFollowUps,
      createFollowUp,
      updateFollowUp,
      removeFollowUp,
      clients,
      loadClients,
      createClient,
      updateClient,
      removeClient,
      payments,
      loadPayments,
      createPayment,
      updatePayment,
      removePayment,
      tasks,
      loadTasks,
      createTask,
      updateTask,
      updateTaskStatus,
      removeTask,
      calendar,
      loadCalendar,
      createCalendarEvent,
      updateCalendarEvent,
      removeCalendarEvent,
      users,
      loadUsers,
      createUser,
      updateUser,
      roles,
      permissionsCatalog,
      loadRoles,
      loadPermissionsCatalog,
      updateRolePermissions,
    ],
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}
