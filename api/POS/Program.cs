using Microsoft.OpenApi.Models;
using POS.Application.Commands.Categories;
using POS.Application.Commands.GRN;
using POS.Application.Commands.Products;
using POS.Application.Commands.Sales;
using POS.Application.Commands.Suppliers;
using POS.Application.Queries.Categories;
using POS.Application.Queries.Dashboard;
using POS.Application.Queries.GRN;
using POS.Application.Queries.Products;
using POS.Application.Queries.Sales;
using POS.Application.Queries.Suppliers;
using POS.Domain.Repositories;
using POS.Infrastructure.Repositories;
using PosSystem.Application.Commands.Customers;
using PosSystem.Application.Commands.Products;
using PosSystem.Application.Commands.Sales;
using PosSystem.Application.Commands.Users;
using PosSystem.Application.Queries.Customers;
using PosSystem.Application.Queries.Products;
using PosSystem.Application.Queries.Sales;
using PosSystem.Application.Queries.Users;
using PosSystem.Domain.Repositories;
using PosSystem.Hubs;
using PosSystem.Infrastructure.Context;
using PosSystem.Infrastructure.Repositories;
using PosSystem.Middleware;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "POS API", Version = "v1" });
});

// Register Dapper context
builder.Services.AddSingleton<DapperContext>();

// Register repositories
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<ISaleRepository, SaleRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ISupplierRepository, SupplierRepository>();
builder.Services.AddScoped<IProductBatchRepository, ProductBatchRepository>();
builder.Services.AddScoped<IGRNRepository, GRNRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IGRNPaymentRepository, GRNPaymentRepository>();

// Register MediatR for CQRS handlers
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly())
);
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssemblies(
        typeof(CreateProductCommand).Assembly,
        typeof(DeleteProductCommand).Assembly,
        typeof(UpdateProductCommand).Assembly,
        typeof(UpdateProductBatchCommand).Assembly,

        typeof(CreateCategoryCommand).Assembly,
        typeof(UpdateCategoryCommand).Assembly,
        typeof(DeleteCategoryCommand).Assembly,

        typeof(CreateCustomerCommand).Assembly,
        typeof(DeleteCustomerCommand).Assembly,
        typeof(UpdateCustomerCommand).Assembly,

        typeof(CreateSaleCommand).Assembly,
        typeof(DeleteHeldSaleCommand).Assembly,
        typeof(UpdateSaleCommand).Assembly,

        typeof(CreateUserCommand).Assembly,
        typeof(AuthenticateUserCommand).Assembly,
        typeof(UpdateUserCommand).Assembly,

        typeof(CreateSupplierCommand).Assembly,
        typeof(DeleteSupplierCommand).Assembly,
        typeof(UpdateSupplierCommand).Assembly,

        typeof(CreateGRNCommand).Assembly,
        typeof(AddGRNPaymentCommand).Assembly,
        typeof(UpdateGRNPaymentStatusCommand).Assembly,

        typeof(GetAllCustomersQuery).Assembly,
        typeof(GetCustomerByIdQuery).Assembly,

        typeof(GetAllProductsQuery).Assembly,
        typeof(GetProductByIdQuery).Assembly,
        typeof(GetProductsByCategoryQuery).Assembly,
        typeof(GetProductBatchesQuery).Assembly,
        typeof(GetProductByBarcodeQuery).Assembly,
        typeof(GetProductPriceVariantsQuery).Assembly,

        typeof(GetCategoryByIdQuery).Assembly,
        typeof(GetAllCategoriesQuery).Assembly,

        typeof(GetSaleByIdQuery).Assembly,
        typeof(GetSalesByCashierQuery).Assembly,
        typeof(GetSalesByDateRangeQuery).Assembly,
        typeof(GetHeldSalesQuery).Assembly,
        typeof(GetSalesStatsQuery).Assembly,
        typeof(VoidSaleCommand).Assembly,

        typeof(GetUserByIdQuery).Assembly,
        typeof(GetUserByUsernameQuery).Assembly,

        typeof(GetAllSuppliersQuery).Assembly,
        typeof(GetSupplierByIdQuery).Assembly,

        typeof(GetAllGRNsQuery).Assembly,
        typeof(GetGRNByIdQuery).Assembly,
        typeof(GetGRNsBySupplierQuery).Assembly,

        typeof(GetBestSellersQuery).Assembly,
        typeof(GetLowStockQuery).Assembly
    )
);


// Configure CORS (modify origins as needed)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin();
    });
});

builder.Services.AddSignalR();
builder.Services.AddMemoryCache();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "POS API v1");
        c.RoutePrefix = string.Empty; // Optional: Swagger UI at application root
    });
}

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapHub<PosHub>("/posHub");
app.MapControllers();

app.Run();