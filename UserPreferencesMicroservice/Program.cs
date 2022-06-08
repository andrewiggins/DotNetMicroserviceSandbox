using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.Resource;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));
builder.Services.AddAuthorization();


var app = builder.Build();

// Configure the HTTP request pipeline.

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

var scopeRequiredByApi = app.Configuration["AzureAd:Scopes"];
var cities = new[]
{
    "Seattle", "New York", "Lagos", "Delhi", "Paris", "Mexico City", "São Paulo", "Nairobi", "Seoul", "Kuala Lumpur"
};

app.MapGet("/userprefs", (HttpContext httpContext) =>
{
    httpContext.VerifyUserHasAnyAcceptedScope(scopeRequiredByApi);

    var userCities = Enumerable.Range(1, 3).Select(index =>
        cities[Random.Shared.Next(0, cities.Length)]
    ).ToArray();

    return new UserPreferences(userCities);
})
.RequireAuthorization();

app.Run();

internal record UserPreferences(ICollection<string> Cities);
