using ARE.Core.Core;
using System;
using System.Threading.Tasks;

namespace ARE.Core.Abstractions
{
    public interface IMiddleware
    {
        /// <summary>Sıralama (küçük = önce çalışır)</summary>
        int Order { get; }

        Task ProcessAsync(AreContext context, Func<Task> next);
    }
}
