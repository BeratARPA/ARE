using ARE.Core.Core;
using System.Threading.Tasks;

namespace ARE.Core.Abstractions
{
    public interface IAction
    {
        /// <summary>Action tipi tanımlayıcı</summary>
        string ActionType { get; }

        /// <summary>Action'ın çalışması</summary>
        Task ExecuteAsync(AreContext context, ActionSettings settings);
    }
}
