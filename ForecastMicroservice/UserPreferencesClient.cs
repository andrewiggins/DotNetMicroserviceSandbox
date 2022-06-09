using Microsoft.Identity.Web;
using Microsoft.Net.Http.Headers;
using System.Net.Http.Headers;

namespace ForecastMicroservice
{
    public class UserPreferencesClient
    {
        private readonly HttpClient httpClient;
        private readonly ITokenAcquisition tokenAcquisition;
        private readonly string[] Scopes = new string[]
        {
            "api://b45d5468-bd83-4787-a644-07747ea2d602/access_as_user"
        };

        public UserPreferencesClient(ITokenAcquisition tokenAcquisition, HttpClient httpClient)
        {
            this.tokenAcquisition = tokenAcquisition;
            this.httpClient = httpClient;
            this.httpClient.BaseAddress = new Uri("https://localhost:7072/");
        }

        public async Task<UserPreferences?> GetUserPreferences()
        {
            // Inspired by https://github.com/AzureAD/microsoft-identity-web/blob/bba91c4298411e780c9f082e8e3843eacd8e543c/src/Microsoft.Identity.Web.MicrosoftGraph/TokenAcquisitionAuthenticationProvider.cs#L60
            // and https://docs.microsoft.com/en-us/aspnet/core/fundamentals/http-requests?view=aspnetcore-6.0
            var accessToken = await this.tokenAcquisition.GetAccessTokenForUserAsync(this.Scopes).ConfigureAwait(false);

            var httpRequestMessage = new HttpRequestMessage(HttpMethod.Get, "userprefs");
            httpRequestMessage.Headers.Authorization = new AuthenticationHeaderValue(Constants.Bearer, accessToken);


            //httpClient.GetFromJsonAsync
            var response = await this.httpClient.SendAsync(httpRequestMessage);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<UserPreferences>();
        }
    }

    public record UserPreferences(ICollection<string> Cities);
}
