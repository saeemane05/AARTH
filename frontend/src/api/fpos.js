import { authApi } from "./auth";

const API_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/$/, "");


async function request(
  path,
  options = {},
  authenticated = false
) {
  const headers = {
    Accept: "application/json",

    ...(options.body
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),
  };


  if (authenticated) {
    const token =
      authApi.getSession()
        ?.access_token;

    if (!token) {
      throw new Error(
        "Please log in to continue."
      );
    }

    headers.Authorization =
      `Bearer ${token}`;
  }


  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    }
  );


  const body =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok) {
    throw new Error(
      body.detail ||
        "Unable to complete this request."
    );
  }


  return body;
}


const query = (
  params = {}
) =>
  new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value
    )
  ).toString();


export const fpoApi = {

  // Public FPO directory
  list: (filters) =>
    request(
      `/api/fpos?${query(filters)}`
    ),

  detail: (id) =>
    request(
      `/api/fpos/${id}`
    ),


  // FPO claim
  claim: (id, data) =>
    request(
      `/api/fpos/${id}/claim`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true
    ),


  // Logged-in FPO workspace
  dashboard: () =>
    request(
      "/api/fpo/dashboard",
      {},
      true
    ),

  organisation: () =>
    request(
      "/api/fpo/organisation",
      {},
      true
    ),

  updateOrganisation: (data) =>
    request(
      "/api/fpo/organisation",
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      true
    ),


  // Farmer network
  members: (filters = {}) =>
    request(
      `/api/fpo/members?${query(filters)}`,
      {},
      true
    ),

  inviteDetails: (code) =>
    request(`/api/fpo/invites/${encodeURIComponent(code)}`),

  farmerDetail: (membershipId) =>
    request(
      `/api/fpo/farmers/${encodeURIComponent(membershipId)}`,
      {},
      true
    ),

  farmerMembership: () =>
    request("/api/fpo/membership", {}, true),


  // Farmer invitation
  invite: () =>
    request(
      "/api/fpo/members/invite",
      {
        method: "POST",
      },
      true
    ),


  // Farmer membership request
  requestMembership: (
    invite_code,
    aarth_id
  ) =>
    request(
      "/api/fpo/members/request",
      {
        method: "POST",
        body: JSON.stringify({
          invite_code,
          aarth_id,
        }),
      },
      true
    ),


  // FPO approval/rejection
  decideMembership: (
    id,
    action
  ) =>
    request(
      `/api/fpo/members/${id}/${action}`,
      {
        method: "PATCH",
      },
      true
    ),


  // Staff
  staff: () =>
    request(
      "/api/fpo/staff",
      {},
      true
    ),

  addStaff: (data) =>
    request(
      "/api/fpo/staff/invite",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true
    ),

  changeStaffRole: (userId, role) =>
    request(
      `/api/fpo/staff/${encodeURIComponent(userId)}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      },
      true
    ),

  changeStaffStatus: (userId, status) =>
    request(
      `/api/fpo/staff/${encodeURIComponent(userId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      true
    ),
};