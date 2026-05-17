using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ConversationMember> ConversationMembers => Set<ConversationMember>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<MessageReaction> MessageReactions => Set<MessageReaction>();
    public DbSet<Call> Calls => Set<Call>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUsers(modelBuilder);
        ConfigureRefreshTokens(modelBuilder);
        ConfigureConversations(modelBuilder);
        ConfigureConversationMembers(modelBuilder);
        ConfigureMessages(modelBuilder);
        ConfigureMessageReactions(modelBuilder);
        ConfigureCalls(modelBuilder);
    }

    private static void ConfigureUsers(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Username)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(x => x.Email)
                .IsRequired()
                .HasMaxLength(150);

            entity.Property(x => x.PasswordHash)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(x => x.AvatarUrl)
                .HasMaxLength(1000);

            entity.Property(x => x.Bio)
                .HasMaxLength(500);

            entity.HasIndex(x => x.Username)
                .IsUnique();

            entity.HasIndex(x => x.Email)
                .IsUnique();
        });
    }

    private static void ConfigureRefreshTokens(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Token)
                .IsRequired()
                .HasMaxLength(500);

            entity.HasOne(x => x.User)
                .WithMany(x => x.RefreshTokens)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureConversations(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(100);

            entity.Property(x => x.ImageUrl)
                .HasMaxLength(1000);

            entity.Property(x => x.Type)
                .IsRequired();
        });
    }

    private static void ConfigureConversationMembers(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ConversationMember>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.HasOne(x => x.Conversation)
                .WithMany(x => x.Members)
                .HasForeignKey(x => x.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.User)
                .WithMany(x => x.ConversationMembers)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.LastReadMessage)
                .WithMany()
                .HasForeignKey(x => x.LastReadMessageId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(x => new { x.ConversationId, x.UserId })
                .IsUnique();
        });
    }

    private static void ConfigureMessages(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Content)
                .IsRequired()
                .HasMaxLength(5000);

            entity.Property(x => x.Type)
                .IsRequired();

            entity.Property(x => x.Status)
                .IsRequired();

            entity.HasOne(x => x.Conversation)
                .WithMany(x => x.Messages)
                .HasForeignKey(x => x.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Sender)
                .WithMany(x => x.SentMessages)
                .HasForeignKey(x => x.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ReplyToMessage)
                .WithMany()
                .HasForeignKey(x => x.ReplyToMessageId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(x => new { x.ConversationId, x.CreatedAt });
            
            entity.Property(x => x.AttachmentUrl)
                .HasMaxLength(1000);

            entity.Property(x => x.AttachmentFileName)
                .HasMaxLength(255);

            entity.Property(x => x.AttachmentContentType)
                .HasMaxLength(100);
        });
    }

    private static void ConfigureMessageReactions(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MessageReaction>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Emoji)
                .IsRequired()
                .HasMaxLength(20);

            entity.HasOne(x => x.Message)
                .WithMany(x => x.Reactions)
                .HasForeignKey(x => x.MessageId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.User)
                .WithMany(x => x.MessageReactions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => new { x.MessageId, x.UserId, x.Emoji })
                .IsUnique();
        });
    }

    private static void ConfigureCalls(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Call>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.HasOne(x => x.Conversation)
                .WithMany(x => x.Calls)
                .HasForeignKey(x => x.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Caller)
                .WithMany(x => x.StartedCalls)
                .HasForeignKey(x => x.CallerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Receiver)
                .WithMany(x => x.ReceivedCalls)
                .HasForeignKey(x => x.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}