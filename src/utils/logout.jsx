export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("accountId");
  localStorage.removeItem("accountNumber");
  localStorage.removeItem("role");
  localStorage.removeItem("email");

  window.location.replace("/login");
};